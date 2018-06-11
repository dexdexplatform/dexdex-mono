import { Tradeable } from '@dexdex/model/lib/tradeable';
import { toWei } from '@dexdex/utils/lib/units';
import { Wallet } from './wallets';
import { BN } from 'bn.js';
import { Trade } from '@dexdex/model/lib/trade';

export enum GasPrice {
  Slow = 'Slow',
  Normal = 'Normal',
  Fast = 'Fast',
}

export interface GasPrices {
  slow: number;
  normal: number;
  fast: number;
}

export interface WidgetConfig {
  gasprices: GasPrices;
  feePercentage: number;
  tokens: Tradeable[];
  featuredTokens: Tradeable[];
  ethers2usdER: number;
  wallets: Wallet[];
}

export enum TxStage {
  Idle = 'Idle',
  SignatureRejected = 'SignatureRejected',
  RequestTokenAllowanceSignature = 'RequestTokenAllowanceSignature',
  TokenAllowanceInProgress = 'TokenAllowanceInProgress',
  RequestTradeSignature = 'RequestTradeSignature',
  TradeInProgress = 'TradeInProgress',
  TradeCompleted = 'TradeCompleted',
  TradeFailed = 'TradeFailed',
  UnkownError = 'UnkownError',
}
export type TransactionState =
  | { stage: TxStage.Idle }
  | {
      stage: TxStage.RequestTradeSignature | TxStage.RequestTokenAllowanceSignature;
    }
  | {
      stage: TxStage.TradeInProgress | TxStage.TokenAllowanceInProgress;
      txId: string;
    }
  | { stage: TxStage.TradeCompleted; trade: Trade }
  | { stage: TxStage.TradeFailed; trade: Trade }
  | { stage: TxStage.SignatureRejected }
  | { stage: TxStage.UnkownError };

export function computeGasPrice(prices: GasPrices, price: GasPrice): BN {
  switch (price) {
    case GasPrice.Slow:
      return toWei(prices.slow, 'gwei');
    case GasPrice.Normal:
      return toWei(prices.normal, 'gwei');
    case GasPrice.Fast:
      return toWei(prices.fast, 'gwei');
    default:
      throw new Error(`invalid gas price ${price}`);
  }
}
