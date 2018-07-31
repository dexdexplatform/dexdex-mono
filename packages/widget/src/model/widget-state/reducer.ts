import { Operation } from '@dexdex/model/lib/base';
import {
  addOrder,
  getSide,
  newOrderBook,
  OrderBook,
  OrderBookSide,
  removeOrder,
  selectOrdersFor,
  updateOrder,
  updateSide,
  Sort,
} from '@dexdex/model/lib/orderbook';
import BN from 'bn.js';
import { fixDecimals, removeExtraZeros } from '@dexdex/utils/lib/format';
import { toTokenDecimals, changeDecimals, DivMode } from '@dexdex/utils/lib/units';
import { WidgetState } from '.';
import { ErrorCode } from '../form-error';
import { OrderBookEvent, OrderEventKind } from '../server-api';
import { TxStage } from '../widget';
import { Actions, GoBackAction, SetTransactionStateAction } from './actions';
import {
  expectedVolume,
  expectedVolumeEth,
  getCurrentAccountState,
  //networkCost,
} from './selectors';
import { canHandle } from '@dexdex/model/lib/order-selection';

function applyEvent(ob: OrderBook, event: OrderBookEvent): OrderBook {
  switch (event.kind) {
    case OrderEventKind.Add:
      return updateSide(ob, event.order.isSell)(
        addOrder(event.order, event.order.isSell ? Sort.ASC : Sort.DES)
      );

    case OrderEventKind.Delete:
      return updateSide(ob, event.order.isSell)(removeOrder(event.order));

    case OrderEventKind.Update:
      return updateSide(ob, event.order.isSell)(updateOrder(event.order));

    case OrderEventKind.Snapshot:
      return newOrderBook(event.snapshot);
    default:
      throw new Error(`invalid OrderEvent ${event}`);
  }
}

function tradeExecutionReducer(
  state: WidgetState['tradeExecution'],
  action: GoBackAction | SetTransactionStateAction
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
      return { ...state, selectedWallet: action.payload };
    case 'setWalletState':
      return {
        ...state,
        wallets: {
          ...state.wallets,
          [action.payload.walletId]: action.payload,
        },
        selectedWallet:
          state.selectedWallet == null && action.payload.status === 'ready'
            ? { wallet: action.payload.walletId, accountIdx: 0 }
            : state.selectedWallet,
      };
    case 'setToken':
      return {
        ...state,
        token: action.payload,
      };
    case 'orderbookEvent':
      return {
        ...state,
        orderbook: applyEvent(state.orderbook || newOrderBook(), action.payload),
      };

    case 'setTransactionState':
    case 'goBack':
      return {
        ...state,
        tradeExecution: tradeExecutionReducer(state.tradeExecution, action),
      };
    case 'showNoWalletModal':
      return {
        ...state,
        noWalletModalOpen: true,
      };
    case 'closeNoWalletModal':
      return {
        ...state,
        noWalletModalOpen: false,
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
  if (obside.orders.length === 0) {
    return ErrorCode.NoOrders;
  } else if (volume.lt(obside.minVolume)) {
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

  // reset orderbook when token changes
  if (anyChanged('token')) {
    st.orderbook = null;
  }

  // If amount is Pristine, we automatically set the amount to the minimun Buy/Sell amount
  if (st.amountPristine && st.orderbook && anyChanged('operation', 'orderbook')) {
    st.amount = removeExtraZeros(
      changeDecimals(
        getSide(st.orderbook, st.operation).minVolume,
        st.token.decimals,
        6,
        DivMode.Ceil
      )
    );
  }

  // If token changed, we adjust the amount to the number of decimals of it
  if (anyChanged('token')) {
    st.amount = fixDecimals(st.amount, st.token.decimals);
  }

  const oldSide = getCurrentSide(oldState.orderbook, oldState.operation);
  const currentSide = getCurrentSide(st.orderbook, st.operation);

  // Recompute isValidAmount if (side,amount or token) changed
  if (oldSide !== currentSide || anyChanged('amount', 'token')) {
    st.errors.amount = computeAmountError(st.amount, st.token.decimals, currentSide);
  }

  // Recompute orderSelection when necessary
  if (currentSide == null || st.errors.amount != null) {
    // we don't have orderbook or the amount is invalid => no valid tx
    st.orderSelection = null;
  } else if (st.orderSelection == null || oldSide !== currentSide) {
    // 1. we don't have current selection
    // 2. ordebookSide changed => (side orders changed OR operation changed) => recompute
    st.orderSelection = selectOrdersFor(currentSide, toTokenDecimals(st.amount, st.token.decimals));
  } else if (anyChanged('amount')) {
    // only the amount changed. Maybe the current computed transaction is still valid
    const volumeTD = toTokenDecimals(st.amount, st.token.decimals);
    if (st.orderSelection && !canHandle(st.orderSelection, volumeTD)) {
      // current is not valid => recompute
      st.orderSelection = selectOrdersFor(
        currentSide,
        toTokenDecimals(st.amount, st.token.decimals)
      );
    }
  }

  // Check Balance errors
  // const newNetworkCost = networkCost(st);
  const newNetworkCost = new BN(0);
  const newAccountState = getCurrentAccountState(st);
  const newVolumeEth = expectedVolumeEth(st);
  if (
    st.errors.amount != null ||
    newNetworkCost == null ||
    newAccountState == null ||
    newVolumeEth == null
  ) {
    // If invalid amount => no plan => can't check balance error
    // If no trade plan => (no network cost Or volumeEth) => can't check balance error
    // If no valid account state => can't check balance error
    st.errors.balance = null;
  } else if (newNetworkCost.gt(newAccountState.balance)) {
    // can't pay network cost
    st.errors.balance = ErrorCode.CantPayNetwork;
  } else if (
    st.operation === 'buy' &&
    newVolumeEth.add(newNetworkCost).gt(newAccountState.balance)
  ) {
    // we don't have enough ether to buy those tokens
    st.errors.balance = ErrorCode.NotEnoughEther;
  } else if (st.operation === 'sell' && expectedVolume(st).gt(newAccountState.tokenBalance)) {
    // we don't have enough tokens to sell
    st.errors.balance = ErrorCode.NotEnoughTokens;
  } else {
    // All Good
    st.errors.balance = null;
  }

  return st;
}

export const reducerWithDefaults = (initialState: WidgetState) => (
  state: WidgetState | undefined,
  action: Actions
): WidgetState => (state === undefined ? reducer(initialState, action) : reducer(state, action));
