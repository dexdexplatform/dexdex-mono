import { Operation } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import { OrderBookEvent } from '../server-api';
import { WalletAccountRef, WalletState } from '../wallets/index';
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
  payload: WalletAccountRef | null;
}

export const setWallet = (payload: WalletAccountRef | null): SetWalletAction => ({
  type: 'setWallet',
  payload,
});

export interface SetWalletStateAction {
  type: 'setWalletState';
  payload: WalletState;
}

export const setWalletState = (payload: WalletState): SetWalletStateAction => ({
  type: 'setWalletState',
  payload,
});

export interface SetTokenAction {
  type: 'setToken';
  payload: Token;
}

export const setToken = (payload: Token): SetTokenAction => ({
  type: 'setToken',
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
  | SetWalletStateAction
  | StartTransactionAction
  | SetTransactionStateAction
  | GoBackAction
  | SetTokenAction;
