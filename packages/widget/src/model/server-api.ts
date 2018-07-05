import { Address } from '@dexdex/model/lib/base';
import { fromJsonOrder, JsonOrder, Order } from '@dexdex/model/lib/order';
import { fromJson, Trade, TradeJson } from '@dexdex/model/lib/trade';
import { accumulateUntil } from '@dexdex/rx';
import { merge, Observable, Observer, Subject, Subscription, using } from 'rxjs';
import { filter, map, share, startWith, switchMapTo, withLatestFrom } from 'rxjs/operators';
import * as io from 'socket.io-client';
import { appConfig } from '../config';
import { WidgetConfig } from './widget';
//-------------------------------------------------------------------------------------------------
// Types
//-------------------------------------------------------------------------------------------------

export enum OrderEventKind {
  Add = 'Add',
  Delete = 'Delete',
  Update = 'Update',
  Snapshot = 'Snapshot',
}

export interface OrderBookSnapshot {
  sells: Order[];
  buys: Order[];
}
export type OrderBookEvent =
  | {
      kind: OrderEventKind.Snapshot;
      tokenAddress: Address;
      snapshot: OrderBookSnapshot;
    }
  | { kind: OrderEventKind.Add; tokenAddress: Address; order: Order }
  | { kind: OrderEventKind.Update; tokenAddress: Address; order: Order }
  | { kind: OrderEventKind.Delete; tokenAddress: Address; order: Order };

export interface JsonOrderBookSnapshot {
  sells: JsonOrder[];
  buys: JsonOrder[];
}

export type JsonOrderBookEvent =
  | {
      kind: OrderEventKind.Snapshot;
      tokenAddress: Address;
      snapshot: JsonOrderBookSnapshot;
    }
  | { kind: OrderEventKind.Add; tokenAddress: Address; order: JsonOrder }
  | { kind: OrderEventKind.Update; tokenAddress: Address; order: JsonOrder }
  | { kind: OrderEventKind.Delete; tokenAddress: Address; order: JsonOrder };

export interface ServerApi {
  getWidgetConfig(widgetId: string): Promise<Exclude<WidgetConfig, 'wallets'>>;
  getOrderBook(tokenAddress: string): Promise<OrderBookSnapshot>;
  getTrade(txhash: string): Promise<Trade | null>;
  orderBookWatcher(tokenAddress: string): Observable<OrderBookEvent>;
}

//-------------------------------------------------------------------------------------------------
// Helpers
//-------------------------------------------------------------------------------------------------

export function fromJsonOrderbookSnapshot(jsonSnap: JsonOrderBookSnapshot): OrderBookSnapshot {
  return {
    buys: jsonSnap.buys.map(fromJsonOrder),
    sells: jsonSnap.sells.map(fromJsonOrder),
  };
}

export function fromJsonOrderbookEvent(event: JsonOrderBookEvent): OrderBookEvent {
  if (event.kind === OrderEventKind.Snapshot) {
    return {
      ...event,
      snapshot: fromJsonOrderbookSnapshot(event.snapshot),
    };
  } else {
    return {
      ...event,
      order: fromJsonOrder(event.order),
    };
  }
}

//-------------------------------------------------------------------------------------------------
// Api Impl
//-------------------------------------------------------------------------------------------------

const getWidgetConfig = async (widgetId: string): Promise<WidgetConfig> => {
  const res = await fetch(`${appConfig().ApiBase}/api/v1/widgets/${widgetId}`);
  if (res.ok) {
    const widgetConfig: WidgetConfig = await res.json();
    widgetConfig.tokens.sort((tkA, tkB) => tkA.symbol.localeCompare(tkB.symbol));
    return widgetConfig;
  } else {
    throw new Error(`Error with request: ${res.status}`);
  }
};

const getTrade = async (txhash: string): Promise<Trade | null> => {
  const res = await fetch(`${appConfig().ApiBase}/api/v1/trades/${txhash}`);
  if (res.ok) {
    const json: TradeJson = await res.json();
    return fromJson(json);
  } else if (res.status === 404) {
    return null;
  } else {
    throw new Error(`Error with request: ${res.status}`);
  }
};

const getOrderBook = async (tokenAddress: string): Promise<OrderBookSnapshot> => {
  const res = await fetch(`${appConfig().ApiBase}/api/v1/orderbooks/${tokenAddress}`);
  if (res.ok) {
    return fromJsonOrderbookSnapshot(await res.json());
  } else {
    throw new Error(`Error with request: ${res.status}`);
  }
};

const eventListener = <A>(socket: SocketIOClient.Socket, eventName: string): Observable<A> => {
  return Observable.create((observer: Observer<A>) => {
    const listener = (event: A) => {
      observer.next(event);
    };

    socket.on(eventName, listener);

    return () => {
      socket.off(eventName, listener);
    };
  });
};

const websocketApi = (socketUrl: string) => {
  // TODO handle reconnection, disconnect, connect failure...
  const socket = io.connect(
    socketUrl,
    { path: '/socket' }
  );

  const connects$ = eventListener(socket, 'connect').pipe(map(() => Date.now()));
  const disconnects$ = eventListener(socket, 'disconnect').pipe(map(() => Date.now()));

  const reconnectDelays$ = connects$.pipe(
    withLatestFrom(disconnects$),
    map(([connected, disconnected]) => (connected - disconnected) / 1000)
  );

  reconnectDelays$.subscribe(delay => {
    console.log('reconnect in :', delay, 'seconds');
  });

  socket.on('connect', () => console.log('connected'));
  // socket.on('connect_timeout', () => console.log('connect timeout'));
  // socket.on('error', (err: any) => console.log('error', err));
  socket.on('disconnect', (err: any) => console.log('disconnect'));
  // socket.on('reconnect_attempt', (nro: number) => console.log('reconnect_attempt', nro));
  // socket.on('reconnect_error', (err: any) => console.log('reconnect_error', err));
  // socket.on('reconnect_failed', () => console.log('reconnect_failed'));
  // socket.on('ping', () => console.log('ping'));
  // socket.on('pong', (latency: number) => console.log('pong', latency));

  const updates$ = eventListener<JsonOrderBookEvent>(socket, 'ob::update').pipe(share());
  const reconnects$ = eventListener(socket, 'reconnect');

  const watchToken = (tokenAddress: string): Observable<OrderBookEvent> => {
    const events = updates$.pipe(
      filter(obe => obe.tokenAddress === tokenAddress),
      map(fromJsonOrderbookEvent)
    );

    const watcher$ = Observable.create((observer: Observer<OrderBookEvent>) => {
      const tokenUnsubsribe = new Subscription(() => {
        socket.emit('unsubscribe', { token: tokenAddress });
      });

      // subject with only one value: the initial snapshot
      const snapshot$ = new Subject<OrderBookEvent>();
      // all delta events, but we buffer all events before the initial snapshot.
      const deltas$ = events.pipe(accumulateUntil(snapshot$));

      // we want to emit 'unsubscribe' on error|completed|unsubscibe
      const allWithTeardown$ = using(() => tokenUnsubsribe, () => merge(snapshot$, deltas$));

      const subscription = allWithTeardown$.subscribe(observer);

      // do the subscription
      socket.emit('subscribe', { token: tokenAddress, withSnapshot: true }, (snapshotJson: any) => {
        try {
          snapshot$.next({
            kind: OrderEventKind.Snapshot,
            tokenAddress: tokenAddress,
            snapshot: fromJsonOrderbookSnapshot(snapshotJson),
          });
        } catch (err) {
          snapshot$.error(err);
        }
      });

      return subscription;
    });

    return reconnects$.pipe(
      startWith(0),
      switchMapTo(watcher$)
    );
  };

  return {
    watchToken,
  };
};

export function createApi(): ServerApi {
  const wsApi = websocketApi(appConfig().ApiBase);

  return {
    getWidgetConfig: getWidgetConfig,
    getOrderBook: getOrderBook,
    getTrade: getTrade,
    orderBookWatcher: wsApi.watchToken,
  };
}
