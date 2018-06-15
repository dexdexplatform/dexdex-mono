import { WalletDetails } from '.';
import { Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { OrderBookEvent } from '../server-api';
import { Wallet } from '../wallets';
import { TransactionState } from '../widget';

//-------------------------------------------------------------------------------------------------
// Actions
//-------------------------------------------------------------------------------------------------

export interface SetAmountAction {
  type: 'setAmount';
  payload: string;
}

export const setAmount = (payload: string): SetAmountAction => ({ type: 'setAmount', payload });

export interface OrderbookEventAction {
  type: 'orderbookEvent';
  payload: OrderBookEvent;
}

export const orderbookEvent = (payload: OrderBookEvent): OrderbookEventAction => ({
  type: 'orderbookEvent',
  payload,
});

export interface SetOperationAction {
  type: 'setOperation';
  payload: Operation;
}

export const setOperation = (payload: Operation): SetOperationAction => ({
  type: 'setOperation',
  payload,
});

export interface SetWalletAction {
  type: 'setWallet';
  payload: Wallet | null;
}

export const setWallet = (payload: Wallet | null): SetWalletAction => ({
  type: 'setWallet',
  payload,
});

export interface SetWalletDetailsAction {
  type: 'setWalletDetails';
  payload: WalletDetails | null;
}

export const setWalletDetails = (payload: WalletDetails | null): SetWalletDetailsAction => ({
  type: 'setWalletDetails',
  payload,
});

export interface SetTradeableAction {
  type: 'setTradeable';
  payload: Tradeable;
}

export const setTradeable = (payload: Tradeable): SetTradeableAction => ({
  type: 'setTradeable',
  payload,
});

export interface StartTransactionAction {
  type: 'startTransaction';
}

export const startTransaction = (): StartTransactionAction => ({
  type: 'startTransaction',
});

export interface GoBackAction {
  type: 'goBack';
}

export const goBack = (): GoBackAction => ({
  type: 'goBack',
});

export interface SetTransactionStateAction {
  type: 'setTransactionState';
  payload: TransactionState;
}

export const setTransactionState = (payload: TransactionState): SetTransactionStateAction => ({
  type: 'setTransactionState',
  payload,
});

export function actionIs(action: Actions, ...types: Actions['type'][]): boolean {
  return types.indexOf(action.type) >= 0;
}

export type Actions =
  | SetAmountAction
  | OrderbookEventAction
  | SetOperationAction
  | SetWalletAction
  | SetWalletDetailsAction
  | StartTransactionAction
  | SetTransactionStateAction
  | GoBackAction
  | SetTradeableAction;
