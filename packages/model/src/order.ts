import { BN } from 'bn.js';
import { percentage } from '@dexdex/utils/lib/bn-math';
import { Address } from './base';

export interface Order {
  id: string;
  /** The other token */
  token: Address;
  /** Wether is buy or sell order */
  isSell: boolean;

  /** token's decimals */
  decimals: number;
  /** token's volume to buy/sell  (in td) */
  volume: BN;
  /** ether's volume to buy/sell (in wei) */
  volumeEth: BN;

  // Values below might change in order updates

  /** fee in ether (in wei) */
  fee: BN;
  /** exhange rate considering the fee: (volumeEth + fee) / volume (wei/td) */
  price: BN;
  /** remaining % [0,1] */
  remaining: number;

  ordersData: string;
}

export type BNFields = 'fee' | 'volume' | 'volumeEth' | 'price';
export type OtherFields = Exclude<keyof Order, BNFields>;
export type JsonOrder = Pick<Order, OtherFields> & Record<BNFields, string>;

export const getOrderRemainingVolume = (o: Order) => percentage(o.remaining, o.volume);

export const getOrderRemainingVolumeEth = (o: Order) => percentage(o.remaining, o.volumeEth);

export function fromJsonOrder(orderS: JsonOrder): Order {
  const { fee, volume, volumeEth, price, ...others } = orderS;
  return {
    fee: new BN(fee, 16),
    volume: new BN(volume, 16),
    volumeEth: new BN(volumeEth, 16),
    price: new BN(price, 16),
    ...others,
  };
}

/**
 * Returns the ordersData to send to dexdex contract
 * for a list of orders.
 *
 * @param orders list of orders to include
 */
export function getOrdersData(orders: Order[]) {
  return (
    '0x' +
    orders.reduce((accum, order) => {
      return order.ordersData.substring(2) + accum;
    }, '')
  );
}

export function getRequiredGas(orders: Order[]) {
  return new BN(500000).muln(orders.length);
}
