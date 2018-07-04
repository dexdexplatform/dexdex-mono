import { BN } from 'bn.js';
import { Operation } from './base';
import * as obmath from './ob-math';
import { Order } from './order';
import { toWei } from '@dexdex/utils/lib/units';
import { OrderSelection } from './order-selection';

/** Minimun Ether we allow to trade */
const MIN_VOLUME_ETH = toWei(0.001, 'ether');
/** Maximun number of orders we can fit on a TradePlan */
const MAX_PLAN_ORDERS = 8;

/**
 * Side of an Orderbook (either buy or sell)
 *
 * Contains information about:
 *
 *  - Minimum tradeable volume of tokens for the orders. Computes the volume by assuming that no
 *  operation can happen for less than `MIN_VOLUME_ETH` ethers.
 *  - Maximum tradeable volume of tokens for the orders. Computes the volume by assuming that we
 *  can't send more than `MAX_PLAN_ORDERS` to the smart contract in a single trade.
 *
 * The `orders` collection is sorted by ascending price for sells & descending price for buys. So,
 * always the first order of each collection has the more convenient price for the taker.
 *
 * The structure should be treated as an immutable object
 */
export interface OrderBookSide {
  orders: Order[];
  minVolume: BN;
  maxVolume: BN;
}

/**
 * An Orderbook for a Token.
 *
 * Contains buy and sells orders for a given token.
 * Orders are sorted in ascending price for sells & descending price for buys. So, always
 * the first order of each collection has the more convenient price for the taker.
 *
 * The structure should be treated as an immutable object
 */
export interface OrderBook {
  buys: OrderBookSide;
  sells: OrderBookSide;
}

export type Updater<A> = (before: A) => A;

function update<A, K extends keyof A>(obj: A, key: K, updater: Updater<A[K]>): A {
  const updatedValue = updater(obj[key]);
  if (updatedValue === obj[key]) {
    return obj;
  } else {
    return Object.assign({}, obj, { [key]: updatedValue });
  }
}

//-------------------------------------------------------------------------------------------------
// Orderbook
//-------------------------------------------------------------------------------------------------

export const newOrderBook = (
  { sells, buys }: { sells: Order[]; buys: Order[] } = { sells: [], buys: [] }
): OrderBook => ({
  sells: newOBSide(sells),
  buys: newOBSide(buys),
});

export const getSide = (ob: OrderBook, op: Operation): OrderBookSide =>
  op === 'buy' ? ob.sells : ob.buys;

export const updateSide = (ob: OrderBook, isSell: boolean) => (
  updater: Updater<OrderBookSide>
): OrderBook => {
  return update(ob, isSell ? 'sells' : 'buys', updater);
};

//-------------------------------------------------------------------------------------------------
// Orderbook Side
//-------------------------------------------------------------------------------------------------

export const newOBSide = (orders: Order[] = []): OrderBookSide => ({
  orders: orders,
  minVolume: obmath.getMinVolume(orders, MIN_VOLUME_ETH),
  maxVolume: obmath.getMaxVolume(orders, MAX_PLAN_ORDERS),
});

export enum Sort {
  ASC,
  DES,
}
export const addOrder = (o: Order, sort: Sort): Updater<OrderBookSide> => obside => {
  const orders = obside.orders;
  const idx = orders.findIndex(
    sort === Sort.ASC ? order => o.price < order.price : order => o.price > order.price
  );
  if (idx >= 0) {
    const newOrders = orders.concat([]);
    newOrders.splice(idx, 0, o);
    return newOBSide(newOrders);
  } else {
    return newOBSide(obside.orders.concat([o]));
  }
};

export const removeOrder = (o: Order): Updater<OrderBookSide> => obside => {
  const orders = obside.orders;
  const idx = orders.findIndex(order => o.id === order.id);
  if (idx >= 0) {
    const newOrders = orders.concat([]);
    newOrders.splice(idx, 1);
    return newOBSide(newOrders);
  } else {
    return obside;
  }
};

export const updateOrder = (o: Order): Updater<OrderBookSide> => obside => {
  const orders = obside.orders;
  const idx = orders.findIndex(order => o.id === order.id);
  if (idx >= 0) {
    const newOrders = orders.concat([]);
    newOrders[idx] = o;
    return newOBSide(newOrders);
  } else {
    return obside;
  }
};

export const selectOrdersFor = (obside: OrderBookSide, volumeTD: BN): OrderSelection => {
  return obmath.selectOrdersFor(obside.orders, MAX_PLAN_ORDERS, volumeTD);
};

export const isValidVolume = (obside: OrderBookSide, volume: BN) =>
  volume.gte(obside.minVolume) && volume.lte(obside.maxVolume);
