import { WidgetState } from '.';
import { fixDecimals, removeExtraZeros } from '@dexdex/utils/lib/format';
import { Operation } from '@dexdex/model/lib/base';
import {
  OrderBook,
  OrderBookSide,
  getSide,
  updateSide,
  orderBookActions,
} from '@dexdex/model/lib/orderbook';
import { OrderBookEvent, OrderEventKind } from '../server-api';
import { fromTokenDecimals, toTokenDecimals } from '@dexdex/utils/lib/units';
import { TxStage } from '../widget';
import { Actions } from './actions';
import { ErrorCode } from '../form-error';

const OB = orderBookActions();

function applyEvent(ob: OrderBook, event: OrderBookEvent): OrderBook {
  switch (event.kind) {
    case OrderEventKind.Add:
      return updateSide(ob, event.order.isSell)(OB.addOrder(event.order));

    case OrderEventKind.Delete:
      return updateSide(ob, event.order.isSell)(OB.removeOrder(event.order));

    case OrderEventKind.Update:
      return updateSide(ob, event.order.isSell)(OB.updateOrder(event.order));

    case OrderEventKind.Snapshot:
      return OB.newOrderBook(event.snapshot);
    default:
      throw new Error(`invalid OrderEvent ${event}`);
  }
}

function tradeExecutionReducer(
  state: WidgetState['tradeExecution'],
  action: Actions
): WidgetState['tradeExecution'] {
  if (action.type === 'goBack') {
    return {
      stage: TxStage.Idle,
      approvalTxHash: null,
      tradeTxHash: null,
      trade: null,
    };
  }

  if (action.type !== 'setTransactionState') {
    return state;
  }

  switch (action.payload.stage) {
    case TxStage.Idle:
      return {
        stage: TxStage.Idle,
        approvalTxHash: null,
        tradeTxHash: null,
        trade: null,
      };
    case TxStage.UnkownError:
    case TxStage.RequestTokenAllowanceSignature:
    case TxStage.RequestTradeSignature:
    case TxStage.SignatureRejected:
      return {
        ...state,
        stage: action.payload.stage,
      };
    case TxStage.TradeFailed:
    case TxStage.TradeCompleted:
      return {
        ...state,
        stage: action.payload.stage,
        trade: action.payload.trade,
      };
    case TxStage.TokenAllowanceInProgress:
      return {
        ...state,
        stage: action.payload.stage,
        approvalTxHash: action.payload.txId,
      };
    case TxStage.TradeInProgress:
      return {
        ...state,
        stage: action.payload.stage,
        tradeTxHash: action.payload.txId,
      };

    default:
      throw new Error(`invalid exeuction stage ${action.payload}`);
  }
}

function applySetters(state: WidgetState, action: Actions): WidgetState {
  switch (action.type) {
    case 'setAmount':
      return { ...state, amount: action.payload, amountPristine: false };
    case 'setOperation':
      return { ...state, operation: action.payload };
    case 'setWallet':
      return { ...state, wallet: action.payload };
    case 'setWalletDetails':
      return { ...state, walletDetails: action.payload };
    case 'setTradeable':
      return {
        ...state,
        tradeable: action.payload,
      };
    case 'orderbookEvent':
      return {
        ...state,
        orderbook: applyEvent(state.orderbook || OB.newOrderBook(), action.payload),
      };

    case 'setTransactionState':
      return {
        ...state,
        tradeExecution: tradeExecutionReducer(state.tradeExecution, action),
      };
    default:
      return { ...state };
  }
}

const computeAmountError = (amount: string, decimals: number, obside: OrderBookSide | null) => {
  if (amount.length === 0) {
    return ErrorCode.VolumeBadFormat;
  }

  if (obside === null) {
    return null;
  }

  const volume = toTokenDecimals(amount, decimals);
  if (volume.lt(obside.minVolume)) {
    return ErrorCode.VolumeTooSmall;
  } else if (volume.gt(obside.maxVolume)) {
    return ErrorCode.VolumeTooBig;
  } else {
    return null;
  }
};

const getCurrentSide = (orderbook: OrderBook | null, op: Operation) =>
  orderbook == null ? null : getSide(orderbook, op);

const changeChecker = <A>(oldVal: A, newVal: A) => (...keys: (keyof A)[]): boolean =>
  keys.some(key => oldVal[key] !== newVal[key]);

function reducer(oldState: WidgetState, action: Actions): WidgetState {
  // apply changes to direct fields in the state
  let st = applySetters(oldState, action);
  const anyChanged = changeChecker(oldState, st);

  // reset orderbook when tradeable changes
  if (anyChanged('tradeable')) {
    st.orderbook = null;
  }

  // If amount is Pristine, we automatically set the amount to the minimun Buy/Sell amount
  if (st.amountPristine && st.orderbook && anyChanged('operation', 'orderbook')) {
    st.amount = removeExtraZeros(
      fromTokenDecimals(getSide(st.orderbook, st.operation).minVolume, st.tradeable.decimals)
    );
  }

  // If tradeable changed, we adjust the amount to the number of decimals of it
  if (anyChanged('tradeable')) {
    st.amount = fixDecimals(st.amount, st.tradeable.decimals);
  }

  const oldSide = getCurrentSide(oldState.orderbook, oldState.operation);
  const currentSide = getCurrentSide(st.orderbook, st.operation);

  // Recompute isValidAmount if (side,amount or tradeable) changed
  if (oldSide !== currentSide || anyChanged('amount', 'tradeable')) {
    st.errors.amount = computeAmountError(st.amount, st.tradeable.decimals, currentSide);
  }

  // Recompute currentTransaction when necessary
  if (currentSide == null || st.errors.amount != null) {
    // we don't have orderbook or the amount is invalid => no valid tx
    st.tradePlan = null;
  } else if (oldSide !== currentSide) {
    // ordebookSide changed => (side orders changed OR operation changed) => recompute
    st.tradePlan = OB.tradePlanFor(currentSide, toTokenDecimals(st.amount, st.tradeable.decimals));
  } else if (anyChanged('amount')) {
    // only the amount changed. Maybe the current computed transaction is still valid
    const volumeTD = toTokenDecimals(st.amount, st.tradeable.decimals);
    if (st.tradePlan && st.tradePlan.canHandle(volumeTD)) {
      st.tradePlan = st.tradePlan!.changeVolume(volumeTD);
    } else {
      // current is not valid => recompute
      st.tradePlan = OB.tradePlanFor(
        currentSide,
        toTokenDecimals(st.amount, st.tradeable.decimals)
      );
    }
  }

  return st;
}

export const reducerWithDefaults = (initialState: WidgetState) => (
  state: WidgetState | undefined,
  action: Actions
): WidgetState => (state === undefined ? reducer(initialState, action) : reducer(state, action));
