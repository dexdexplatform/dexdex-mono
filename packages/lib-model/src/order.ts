import { BN } from 'bn.js';
import { percentage } from '@dexdex/utils/lib/bn-math';
import { Address } from './base';
import { getDecimalBase, fromWei } from '@dexdex/utils/lib/units';

/**
 * DexDex Order data structure.
 *
 * An orders corresponds to an intent of buying or selling (`isSell`) a specified amount of tokens (`volume`) in
 * exchange to an amount of Ether (`volumeEth`).
 *
 * An order can be partially filled, meaning that from the original amounts, only a part remains.
 * This is determined by `remaining` attribute.
 *
 * Order's relevant data for the smart contract is the `ordersData` which is the part that MUST be
 * sent to the contract in order to fill the order.
 */
export interface Order {
  /** unique id for the order */
  id: string;
  /** Ethereum Address for the Token to be sold or bought */
  token: Address;
  /** Wether is buy or sell order */
  isSell: boolean;

  /** Number of decimals the token has. Needed to interpret `volume` as a decimal number */
  decimals: number;
  /** Original volume of tokens. Expressed as a big integer. The real volume is: {volume} / 1e{decimals}  */
  volume: BN;
  /** Original volume of tokens. Expressed in wei */
  volumeEth: BN;
  /** Price for tokens, expressed in eth. Computed volumeEth / volume with necessary unit conversions */
  price: number;

  // Mutable Values

  /** Percentage of the order that remains to be filled. A number in range [0,1] */
  remaining: number;

  /** Encoded order data for the Order. Used by the Smart Contract. Starts with 0x */
  ordersData: string;
}

export type BNFields = 'volume' | 'volumeEth';
export type OtherFields = Exclude<keyof Order, BNFields>;
export type JsonOrder = Pick<Order, OtherFields> & Record<BNFields, string>;

export const getOrderRemainingVolume = (o: Order) => percentage(o.remaining, o.volume);

export const getOrderRemainingVolumeEth = (o: Order) => percentage(o.remaining, o.volumeEth);

export const computePrice = (volumeEth: BN, volume: BN, tokenDecimals: number) => {
  const priceWei = volumeEth.mul(getDecimalBase(tokenDecimals)).div(volume);
  return Number(fromWei(priceWei, 'ether'));
};

export function fromJsonOrder(orderS: JsonOrder): Order {
  const { volume, volumeEth, ...others } = orderS;
  return {
    volume: new BN(volume, 10),
    volumeEth: new BN(volumeEth, 10),
    ...others,
  };
}

export function toJsonOrder(order: Order): JsonOrder {
  const { volume, volumeEth, ...others } = order;
  return {
    volume: volume.toString(10),
    volumeEth: volumeEth.toString(10),
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
