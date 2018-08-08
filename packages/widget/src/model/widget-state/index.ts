import { Address, Operation } from '@dexdex/model/lib/base';
import { OrderSelection } from '@dexdex/model/lib/order-selection';
import { OrderBook } from '@dexdex/model/lib/orderbook';
import { Token } from '@dexdex/model/lib/token';
import { Trade } from '@dexdex/model/lib/trade';
import BN from 'bn.js';
import Eth from 'ethjs-query';
import { AmountError, BalanceError } from '../form-error';
import { createApi } from '../server-api';
import { WalletId } from '../wallets/base';
import { GasPrice, TxStage, WidgetConfig } from '../widget';
import * as actions from './actions';
import rootEpic from './epics';
import { reducerWithDefaults } from './reducer';
import { createStore, Store } from './store';

//-------------------------------------------------------------------------------------------------
// Types
//-------------------------------------------------------------------------------------------------

export type WidgetScreen =
  | 'form'
  | 'error'
  | 'tradeSuccess'
  | 'signatureTrade'
  | 'signatureApproval'
  | 'waitingApproval'
  | 'rejectedSignature'
  | 'waitingTrade';

export interface Wallet {
  id: WalletId;
  eth: Eth;
  networkId: number;
  address: Address;
}

export interface WalletDetails extends Wallet {
  balance: BN;
  tokenBalance: BN;
}

export interface WidgetState {
  config: WidgetConfig;
  noWalletModalOpen: boolean;
  operation: Operation;
  token: Token;
  wallet: null | WalletDetails;
  amountPristine: boolean;
  amount: string; // expressed in Tokens #
  orderbook: OrderBook | null;
  gasPrice: GasPrice;
  errors: {
    amount: null | AmountError;
    balance: null | BalanceError;
  };
  orderSelection: OrderSelection | null;
  tradeExecution: {
    stage: TxStage;
    approvalTxHash: null | string;
    tradeTxHash: null | string;
    trade: null | Trade;
  };
}

export type WidgetStore = Store<WidgetState, actions.Actions>;

export interface Operations {
  setOperation: (operation: Operation) => void;
  setToken: (token: Token) => void;
  setWallet: (wallet: Wallet) => void;
  setAmount: (amount: string) => void;
  startTransaction: () => void;
}

//-------------------------------------------------------------------------------------------------
// Store Initialization
//-------------------------------------------------------------------------------------------------

export async function initWidget(
  widgetId: string,
  operations: string | null,
  tokens: string | null
): Promise<Store<WidgetState, actions.Actions>> {
  const api = createApi();
  const config: WidgetConfig = await api.getWidgetConfig(widgetId, operations, tokens);

  const initialState: WidgetState = {
    config,
    noWalletModalOpen: false,
    operation: config.enabledOperations.length > 1 ? 'buy' : config.enabledOperations[0],
    token: config.initialToken || config.tokens[0],
    wallet: null,
    amountPristine: true,
    amount: '0', // expressed in Tokens #
    orderbook: null,
    gasPrice: GasPrice.Normal,
    errors: {
      amount: null,
      balance: null,
    },
    orderSelection: null,
    tradeExecution: {
      stage: TxStage.Idle,
      approvalTxHash: null,
      tradeTxHash: null,
      trade: null,
    },
  };

  return createStore(reducerWithDefaults(initialState), rootEpic(api));
}
