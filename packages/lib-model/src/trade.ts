import { Address } from './base';
import { BN } from 'bn.js';

export enum TradeState {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
}

export interface Trade {
  id: string;
  txhash: string;
  state: TradeState;
  isSell: boolean;
  tradeableAddress: Address;
  senderAddress: Address;
  depositAddress: Address;
  affiliateAddress: Address;
  ordersData: Buffer;
  volume: BN;
  volumeEth: BN;
  volumeEffective: BN | null;
  volumeEthEffective: BN | null;
  updatedDate: Date;
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
  volume: string;
  volumeEth: string;
  volumeEffective: string | null;
  volumeEthEffective: string | null;
  updatedDate: string;
  createdDate: string;
}

export function toJson(trade: Trade): TradeJson {
  return {
    ...trade,
    ordersData: '0x' + trade.ordersData.toString('hex'),
    volume: trade.volume.toString(10),
    volumeEth: trade.volumeEth.toString(10),
    volumeEffective: trade.volumeEffective == null ? null : trade.volumeEffective.toString(10),
    volumeEthEffective:
      trade.volumeEthEffective == null ? null : trade.volumeEthEffective.toString(10),
    updatedDate: trade.updatedDate.toISOString(),
    createdDate: trade.createdDate.toISOString(),
  };
}

export function fromJson(tradeWire: TradeJson): Trade {
  return {
    ...tradeWire,
    ordersData: Buffer.from(tradeWire.ordersData.slice(2), 'hex'),
    volume: new BN(tradeWire.volume),
    volumeEth: new BN(tradeWire.volumeEth),
    volumeEffective: tradeWire.volumeEffective == null ? null : new BN(tradeWire.volumeEffective),
    volumeEthEffective:
      tradeWire.volumeEthEffective == null ? null : new BN(tradeWire.volumeEthEffective),
    updatedDate: new Date(tradeWire.updatedDate),
    createdDate: new Date(tradeWire.createdDate),
  } as any;
}
