import { Address, Operation } from '@dexdex/model/lib/base';
import { OrderBook } from '@dexdex/model/lib/orderbook';
import { Trade } from '@dexdex/model/lib/trade';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { BN } from 'bn.js';
import { AmountError, BalanceError } from '../form-error';
import { createApi } from '../server-api';
import { WalletAccountRef, WalletId, WalletState } from '../wallets/index';
import { GasPrice, TxStage, WidgetConfig } from '../widget';
import * as actions from './actions';
import rootEpic from './epics';
import { reducerWithDefaults } from './reducer';
import { createStore, Store } from './store';
import { OrderSelection } from '../../../../lib-model/lib/order-selection';

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

export interface WalletDetails {
  address: Address | null;
  etherBalance: BN;
  tradeableBalance: BN | null;
}

export interface WidgetState {
  config: WidgetConfig;
  operation: Operation;
  tradeable: Tradeable;
  wallets: Partial<Record<WalletId, WalletState>>;
  selectedWallet: null | WalletAccountRef;
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
  setTradeable: (tradeable: Tradeable) => void;
  setWallet: (wallet: WalletAccountRef | null) => void;
  setAmount: (amount: string) => void;
  startTransaction: () => void;
}

//-------------------------------------------------------------------------------------------------
// Store Initialization
//-------------------------------------------------------------------------------------------------

export async function initWidget(widgetId: string): Promise<Store<WidgetState, actions.Actions>> {
  const api = createApi();
  const config: WidgetConfig = await api.getWidgetConfig(widgetId);

  const initialState: WidgetState = {
    config,
    operation: 'buy',
    tradeable: config.tokens[0],
    wallets: {},
    selectedWallet: null,
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
