import { Observable, Observer } from 'rxjs';
import { filter, map, share, withLatestFrom } from 'rxjs/operators';
import * as io from 'socket.io-client';
import { Address } from '@dexdex/model/lib/base';
import { JsonOrder, Order, fromJsonOrder } from '@dexdex/model/lib/order';
import { WidgetConfig } from './widget';
import { Trade, TradeJson, fromJson } from '@dexdex/model/lib/trade';
import { ApiBase } from '../config';
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
      tradeableAddress: Address;
      snapshot: OrderBookSnapshot;
    }
  | { kind: OrderEventKind.Add; tradeableAddress: Address; order: Order }
  | { kind: OrderEventKind.Update; tradeableAddress: Address; order: Order }
  | { kind: OrderEventKind.Delete; tradeableAddress: Address; order: Order };

export interface JsonOrderBookSnapshot {
  sells: JsonOrder[];
  buys: JsonOrder[];
}

export type JsonOrderBookEvent =
  | {
      kind: OrderEventKind.Snapshot;
      tradeableAddress: Address;
      snapshot: JsonOrderBookSnapshot;
    }
  | { kind: OrderEventKind.Add; tradeableAddress: Address; order: JsonOrder }
  | { kind: OrderEventKind.Update; tradeableAddress: Address; order: JsonOrder }
  | { kind: OrderEventKind.Delete; tradeableAddress: Address; order: JsonOrder };

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

const getWidgetConfig = async (widgetId: string): Promise<Exclude<WidgetConfig, 'wallets'>> => {
  const res = await fetch(`${ApiBase}/api/v1/widgets/${widgetId}`);
  if (res.ok) {
    return await res.json();
  } else {
    throw new Error(`Error with request: ${res.status}`);
  }
};

const getTrade = async (txhash: string): Promise<Trade | null> => {
  const res = await fetch(`${ApiBase}/api/v1/trades/${txhash}`);
  if (res.ok) {
    const json: TradeJson = await res.json();
    return fromJson(json);
  } else if (res.status === 404) {
    return null;
  } else {
    throw new Error(`Error with request: ${res.status}`);
  }
};

const getOrderBook = async (tradeableAddress: string): Promise<OrderBookSnapshot> => {
  const res = await fetch(`${ApiBase}/api/v1/orderbooks/${tradeableAddress}`);
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

const socketEvent$ = (socket: SocketIOClient.Socket, eventName: string): Observable<any> =>
  Observable.create((observer: Observer<any>) => {
    const handler = (val: any) => observer.next(val);
    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  });

const websocketApi = (socketUrl: string) => {
  // TODO handle reconnection, disconnect, connect failure...
  const socket = io.connect(
    socketUrl,
    { path: '/socket' }
  );

  const connects$ = socketEvent$(socket, 'connect').pipe(map(() => Date.now()));
  const disconnects$ = socketEvent$(socket, 'disconnect').pipe(map(() => Date.now()));

  const reconnect$ = connects$.pipe(
    withLatestFrom(disconnects$),
    map(([connected, disconnected]) => (connected - disconnected) / 1000)
  );

  reconnect$.subscribe(delay => {
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

  const watchTradeable = (tokenAddress: string): Observable<OrderBookEvent> => {
    const events = updates$.pipe(filter(obe => obe.tradeableAddress === tokenAddress));

    return Observable.create((observer: Observer<OrderBookEvent>) => {
      let orderbookReady = false;
      let savedEvents: OrderBookEvent[] = [];

      const eventSubscription = events.subscribe({
        next: orderEvent => {
          if (orderbookReady) {
            observer.next(fromJsonOrderbookEvent(orderEvent));
          } else {
            savedEvents.push(fromJsonOrderbookEvent(orderEvent));
          }
        },
        error: err => {
          console.error('ob::Event error', err);
          socket.emit('unsubscribe', { tradeable: tokenAddress });
          observer.error(err);
        },
      });

      const unsubscribe = () => {
        socket.emit('unsubscribe', { tradeable: tokenAddress });
        eventSubscription.unsubscribe();
      };

      socket.emit(
        'subscribe',
        { tradeable: tokenAddress, withSnapshot: true },
        (snapshotJson: any) => {
          try {
            const snapshot = fromJsonOrderbookSnapshot(snapshotJson);
            observer.next({
              kind: OrderEventKind.Snapshot,
              tradeableAddress: tokenAddress,
              snapshot,
            });
            orderbookReady = true;
            savedEvents.forEach(e => {
              observer.next(e);
            });
            savedEvents = [];
          } catch (err) {
            console.error('ob::Subscribe error', err);
            unsubscribe();
            observer.error(err);
          }
        }
      );

      return unsubscribe;
    });
  };

  return {
    watchTradeable,
  };
};

export function createApi(): ServerApi {
  const wsApi = websocketApi(ApiBase);

  return {
    getWidgetConfig: getWidgetConfig,
    getOrderBook: getOrderBook,
    getTrade: getTrade,
    orderBookWatcher: wsApi.watchTradeable,
  };
}
