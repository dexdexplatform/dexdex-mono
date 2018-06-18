import { Address, Operation } from '@dexdex/model/lib/base';
import { OrderBook } from '@dexdex/model/lib/orderbook';
import { Trade } from '@dexdex/model/lib/trade';
import { TradePlan } from '@dexdex/model/lib/trade-plan';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { BN } from 'bn.js';
import { createApi } from '../server-api';
import { getWallets, Wallet } from '../wallets';
import { GasPrice, TxStage, WidgetConfig } from '../widget';
import * as actions from './actions';
import rootEpic from './epics';
import { reducerWithDefaults } from './reducer';
import { createStore, Store } from './store';
import { ErrorCode } from '../form-error';

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
  wallet: null | Wallet;
  amountPristine: boolean;
  amount: string; // expressed in Tokens #
  orderbook: OrderBook | null;
  gasPrice: GasPrice;
  walletDetails: null | WalletDetails;
  errors: {
    amount: null | ErrorCode.VolumeTooBig | ErrorCode.VolumeTooSmall | ErrorCode.VolumeBadFormat;
    balance: null | ErrorCode.CantPayNetwork | ErrorCode.InsufficientFunds;
  };
  tradePlan: TradePlan | null;
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
  setWallet: (wallet: Wallet | null) => void;
  setAmount: (amount: string) => void;
  startTransaction: () => void;
}

//-------------------------------------------------------------------------------------------------
// Store Initialization
//-------------------------------------------------------------------------------------------------

export async function initWidget(widgetId: string): Promise<Store<WidgetState, actions.Actions>> {
  const api = createApi();
  const config: WidgetConfig = await api.getWidgetConfig(widgetId);
  config.wallets = await getWallets();

  const initialState: WidgetState = {
    config,
    operation: 'buy',
    tradeable: config.tokens[0],
    wallet: config.wallets.length > 0 ? config.wallets[0] : null,
    amountPristine: true,
    amount: '0', // expressed in Tokens #
    orderbook: null,
    gasPrice: GasPrice.Normal,
    walletDetails: null,
    errors: {
      amount: null,
      balance: null,
    },
    tradePlan: null,
    tradeExecution: {
      stage: TxStage.Idle,
      approvalTxHash: null,
      tradeTxHash: null,
      trade: null,
    },
  };

  return createStore(reducerWithDefaults(initialState), rootEpic(api));
}
