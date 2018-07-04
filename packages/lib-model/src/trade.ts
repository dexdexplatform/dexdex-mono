import { Address } from './base';
import { BN } from 'bn.js';

export enum TradeState {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
}

/**
 * Represents a trade that can be in process (Pending), completed or failed.
 *
 * The fields are divided between:
 *   - parameters for the trade (information sent to the smart contract)
 *   - result of the trade (comes the Ethereum Transaction executed)
 */
export interface Trade {
  /** unique id for the Trade */
  id: string;
  /** Ethereum transaction hash on which the trade was executed */
  txhash: string;
  /** Current state */
  state: TradeState;
  /** Wether it is a sell or a buy */
  isSell: boolean;
  /** Ethereum Address of the ERC20 token involved */
  tradeableAddress: Address;
  /** Ethereum Address of the account that originated the trade (smart contract caller) */
  senderAddress: Address;
  /** Ethereum Address where the trade result has or will be deposited */
  depositAddress: Address;
  /** Ethereum Address of the trade affiliate (if any) */
  affiliateAddress: Address;
  /** Encoded information about the orders involved in the trade */
  ordersData: Buffer;
  /** Gas price used for the trade (in wei) */
  gasPrice: BN;
  /** Expected token volume for the trade. (encoded as a integer) */
  volume: BN;
  /** Expected eth volume for the trade. (in wei) */
  volumeEth: BN;
  /**
   * Only if Completed
   * The actual token volume that was traded, it's <= volume
   * (encoded as a integer)
   */
  volumeEffective: BN | null;
  /**
   * Only if Completed
   * The actual eth volume that was traded, it's <= volumeEth
   * (encoded as a integer)
   */
  volumeEthEffective: BN | null;
  /** Only if Completed or Failed. Gas Amount consumed by the transaction  */
  gasUsed: BN | null;
  /**
   * Only if Completed or Failed.
   * Date on which the Ethereum Address for the trade was mined.
   * Actually, the block address
   */
  executionDate: Date | null;
  /** Last Update Date */
  updatedDate: Date;
  /** Creation Date */
  createdDate: Date;
}

export interface TradeJson {
  id: string;
  txhash: string;
  state: TradeState;
  isSell: boolean;
  tradeableAddress: Address;
  senderAddress: Address;
  depositAddress: Address;
  affiliateAddress: Address;
  ordersData: string;
  gasPrice: string;
  volume: string;
  volumeEth: string;
  volumeEffective: string | null;
  volumeEthEffective: string | null;
  gasUsed: string | null;
  executionDate: string | null;
  updatedDate: string;
  createdDate: string;
}

export function toJson(trade: Trade): TradeJson {
  return {
    ...trade,
    ordersData: '0x' + trade.ordersData.toString('hex'),
    gasPrice: trade.gasPrice.toString(10),
    volume: trade.volume.toString(10),
    volumeEth: trade.volumeEth.toString(10),
    volumeEffective: trade.volumeEffective == null ? null : trade.volumeEffective.toString(10),
    volumeEthEffective:
      trade.volumeEthEffective == null ? null : trade.volumeEthEffective.toString(10),
    gasUsed: trade.gasUsed == null ? null : trade.gasUsed.toString(10),
    executionDate: trade.executionDate ? trade.executionDate.toISOString() : null,
    updatedDate: trade.updatedDate.toISOString(),
    createdDate: trade.createdDate.toISOString(),
  };
}

export function fromJson(tradeWire: TradeJson): Trade {
  return {
    ...tradeWire,
    ordersData: Buffer.from(tradeWire.ordersData.slice(2), 'hex'),
    gasPrice: new BN(tradeWire.gasPrice),
    volume: new BN(tradeWire.volume),
    volumeEth: new BN(tradeWire.volumeEth),
    volumeEffective: tradeWire.volumeEffective == null ? null : new BN(tradeWire.volumeEffective),
    volumeEthEffective:
      tradeWire.volumeEthEffective == null ? null : new BN(tradeWire.volumeEthEffective),
    gasUsed: tradeWire.gasUsed == null ? null : new BN(tradeWire.gasUsed),
    executionDate: tradeWire.executionDate ? new Date(tradeWire.executionDate) : null,
    updatedDate: new Date(tradeWire.updatedDate),
    createdDate: new Date(tradeWire.createdDate),
  };
}
