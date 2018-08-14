import { Trade } from '@dexdex/model/lib/trade';
import { Token } from '@dexdex/model/lib/token';
import { toWei } from '@dexdex/utils/lib/units';
import BN from 'bn.js';
import { Address } from 'ethjs-contract';
import { Operation } from '@dexdex/model/lib/base';

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
  tokens: Token[];
  initialToken: Token;
  initialTokenAddress: Address;
  affiliateAddress: Address;
  enabledOperations: Operation[];
  ethers2usdER: number;
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
  LedgerNotConnected = 'LedgerNotConnected',
  UnkownError = 'UnkownError',
}

// prettier-ignore
export type TransactionState =
  | { stage: TxStage.Idle                                        }
  | { stage: TxStage.RequestTradeSignature                       }
  | { stage: TxStage.RequestTokenAllowanceSignature              }
  | { stage: TxStage.TradeInProgress;               txId: string }
  | { stage: TxStage.TokenAllowanceInProgress;      txId: string }
  | { stage: TxStage.TradeCompleted;                trade: Trade }
  | { stage: TxStage.TradeFailed;                   trade: Trade }
  | { stage: TxStage.SignatureRejected                           }
  | { stage: TxStage.LedgerNotConnected                          }
  | { stage: TxStage.UnkownError                                 };

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
