import { fromWei, getDecimalBase } from '@dexdex/utils/lib/units';
import BN from 'bn.js';
import { Address } from './base';

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
  /** Price for tokens, expressed in eth. Computed volumeEth / volume with necessary unit conversions */
  price: number;

  // Mutable Values

  /** Remaining volume of tokens. Expressed as a big integer. The real volume is: {volume} / 1e{decimals}  */
  remainingVolume: BN;
  /** Remaining volume of tokens. Expressed in wei */
  remainingVolumeEth: BN;

  /** Encoded order data for the Order. Used by the Smart Contract. Starts with 0x */
  ordersData: string;
}

export type BNFields = 'remainingVolume' | 'remainingVolumeEth';
export type OtherFields = Exclude<keyof Order, BNFields>;
export type JsonOrder = Pick<Order, OtherFields> & Record<BNFields, string>;

export const computePrice = (volumeEth: BN, volume: BN, tokenDecimals: number) => {
  const priceWei = volumeEth.mul(getDecimalBase(tokenDecimals)).div(volume);
  return Number(fromWei(priceWei, 'ether'));
};

export function fromJsonOrder(orderS: JsonOrder): Order {
  const { remainingVolume, remainingVolumeEth, ...others } = orderS;
  return {
    remainingVolume: new BN(remainingVolume, 10),
    remainingVolumeEth: new BN(remainingVolumeEth, 10),
    ...others,
  };
}

export function toJsonOrder(order: Order): JsonOrder {
  const { remainingVolume, remainingVolumeEth, ...others } = order;
  return {
    remainingVolume: remainingVolume.toString(10),
    remainingVolumeEth: remainingVolumeEth.toString(10),
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
