import { BN } from 'bn.js';
import { Operation } from './base';
import * as obmath from './ob-math';
import { Order } from './order';
import { toWei } from '@dexdex/utils/lib/units';
import { TradePlan } from './trade-plan';

export type OrderBookConfig = {
  minVolumeEth: BN;
  maxTransactionOrders: number;
};

const DefaultConfig = {
  minVolumeEth: toWei(0.001, 'ether'),
  maxTransactionOrders: 2,
};

Object.freeze(DefaultConfig);

export interface OrderBookSide {
  orders: Order[];
  minVolume: BN;
  maxVolume: BN;
}

export interface OrderBook {
  buys: OrderBookSide;
  sells: OrderBookSide;
}

export type Updater<A> = (before: A) => A;

export const getSide = (ob: OrderBook, op: Operation): OrderBookSide =>
  op === 'buy' ? ob.sells : ob.buys;

export const updateSide = (ob: OrderBook, isSell: boolean) => (
  updater: Updater<OrderBookSide>
): OrderBook => {
  if (isSell) {
    ob.sells = updater(ob.sells);
  } else {
    ob.buys = updater(ob.buys);
  }
  return ob;
};

export const orderBookActions = (cfg: OrderBookConfig = DefaultConfig) => {
  const isValidVolume = (obside: OrderBookSide, volume: BN) =>
    volume.gte(obside.minVolume) && volume.lte(obside.maxVolume);

  const newOBSide = (orders: Order[] = []): OrderBookSide => ({
    orders: orders,
    minVolume: obmath.getMinVolume(orders, cfg.minVolumeEth),
    maxVolume: obmath.getMaxVolume(orders, cfg.maxTransactionOrders),
  });

  const newOrderBook = (
    { sells, buys }: { sells: Order[]; buys: Order[] } = { sells: [], buys: [] }
  ): OrderBook => ({
    sells: newOBSide(sells),
    buys: newOBSide(buys),
  });

  const addOrder = (o: Order): Updater<OrderBookSide> => obside =>
    newOBSide(obside.orders.concat([o]));

  const removeOrder = (o: Order): Updater<OrderBookSide> => obside => {
    const orders = obside.orders;
    const idx = orders.findIndex(order => o.id === order.id);
    if (idx >= 0) {
      const copy = orders.concat([]);
      copy.splice(idx, 1);
      return newOBSide(obside.orders);
    } else {
      return obside;
    }
  };

  const updateOrder = (o: Order): Updater<OrderBookSide> => obside => {
    const orders = obside.orders;
    const idx = orders.findIndex(order => o.id === order.id);
    if (idx >= 0) {
      const copy = orders.concat([]);
      copy[idx] = o;
      return newOBSide(obside.orders);
    } else {
      return obside;
    }
  };

  const tradePlanFor = (obside: OrderBookSide, volumeTD: BN): TradePlan => {
    return obmath.tradePlanFor(obside.orders, cfg.maxTransactionOrders, volumeTD);
  };

  return {
    newOrderBook,
    newOBSide,
    addOrder,
    removeOrder,
    updateOrder,
    tradePlanFor,
    isValidVolume,
  };
};
