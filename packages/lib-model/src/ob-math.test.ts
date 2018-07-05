import { fromTokenDecimals, toTokenDecimals, toWei } from '@dexdex/utils/lib/units';
import { BN } from 'bn.js';
import * as obmath from './ob-math';
import { computePrice, getOrderRemainingVolumeEth, Order } from './order';
import { maxVolume, maxVolumeEth } from './order-selection';

let nextId = 1;
let TokenDecimals = 10;

beforeEach(() => {
  nextId = 1;
});

expect.extend({
  toEqualBN(received: any, argument: BN) {
    const pass = BN.isBN(received) && received.eq(argument);
    if (pass) {
      return {
        message: () =>
          `expected ${received.toString(10)} not to be equal to ${argument.toString(10)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received.toString(10)} to be equal to ${argument.toString(10)}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    // tslint:disable-next-line:interface-name
    interface Matchers<R> {
      toEqualBN(x: BN): R;
    }
  }
}

function createOrder(opts: Pick<Order, 'volume' | 'volumeEth' | 'remaining'>): Order {
  const volume = opts.volume;
  const volumeEth = opts.volumeEth;

  return {
    id: `order-${nextId++}`,
    token: '0x0000000000000000000000000000000000000000',
    isSell: true,
    decimals: TokenDecimals,
    volume,
    volumeEth,
    price: computePrice(volumeEth, volume, TokenDecimals),
    remaining: opts.remaining || 1,
    ordersData: '',
  };
}

/*
sell order fee calculation:
fee % = 3%
how much ether should i send so that (100% - 3%) of that is the total volumeEth?
total = volume / (100% - 3%)   // this is 100% of total ether to send
3% of that is the fee
fee = volume / (100% - 3%) * 3%
*/

function sellOrderED(tokens: number, ether: number, remaining: number = 1) {
  const volume = toTokenDecimals(tokens, TokenDecimals);
  const volumeEth = toWei(ether, 'ether')
    .muln(1003)
    .divn(1000);
  return createOrder({
    volume,
    volumeEth: volumeEth,
    remaining,
  });
}

describe('obmath', () => {
  describe('findMinVolumeIdx()', () => {
    test('simple case', () => {
      const idx = obmath._findMinVolumeIdx([
        sellOrderED(30, 5),
        sellOrderED(20, 10),
        sellOrderED(50, 30),
      ]);
      expect(idx).toBe(1); // second order has minimun volume
    });
    test('different remaining values', () => {
      const idx = obmath._findMinVolumeIdx([
        sellOrderED(20, 10, 1),
        sellOrderED(20, 10, 0.5),
        sellOrderED(20, 10, 0.3),
      ]);
      // third order has minimun volume if we consider remaining amount
      expect(idx).toBe(2);
    });
  });

  describe('getMinVolume()', () => {
    test('simple case', () => {
      const orders = [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)];
      const minVolume = obmath.getMinVolume(orders, toWei(0.001, 'ether'));

      // price is Eth / volume
      // const price = (5 * 1.003) / 30;
      // MIN volumeEth is 0.001 ether
      // min volume is: volumeEth / price
      // const minVolumeExpected = 0.001 / price;

      // http://www.wolframalpha.com/input/?i=0.001+%2F+(5+*+1.003+%2F+30)
      expect(minVolume).toEqualBN(toTokenDecimals('0.0059820538', TokenDecimals));
    });
  });

  describe('getMaxVolume()', () => {
    test('simple case', () => {
      const maxVolume = obmath.getMaxVolume(
        [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)],
        1
      );
      expect(Number(fromTokenDecimals(maxVolume, TokenDecimals))).toBe(50);
    });
    test('simple case - 2', () => {
      const maxVolume = obmath.getMaxVolume(
        [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)],
        2
      );
      expect(Number(fromTokenDecimals(maxVolume, TokenDecimals))).toBe(80);
    });
  });

  describe('selectOrdersFor()', () => {
    test('case: 1 order - partial completion', () => {
      const orders = [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)];
      const tx = obmath.selectOrdersFor(orders, 1, toTokenDecimals(20, TokenDecimals));

      // expected result:
      //   we use only the first order, since it has 30 and we need only 20
      expect(tx.orders).toHaveLength(1);
      const order = orders[0];
      expect(tx.orders[0].id).toBe(order.id);

      // ether amount is proporitonal a 20/30 (required/available)
      const volumeEth = order.volumeEth;
      const requiredVolumeEth = volumeEth.muln(20).divn(30);

      expect(tx.baseVolumeEth).toEqualBN(requiredVolumeEth);

      // this selection is valid until we reach 30 tokens (max volume)
      expect(maxVolume(tx)).toEqualBN(toTokenDecimals(30, TokenDecimals));
      expect(maxVolumeEth(tx)).toEqualBN(volumeEth);
    });

    test('case: 1 order - partial completion - order is not full', () => {
      const orders = [sellOrderED(30, 5, 0.5), sellOrderED(20, 10), sellOrderED(50, 30)];
      const tx = obmath.selectOrdersFor(orders, 1, toTokenDecimals(10, TokenDecimals));

      const order = orders[0];
      // we have half the order remaining
      const volumeEth = order.volumeEth.divn(2);
      // half the volume (10), when we want 15 is (* 10 / 15)
      const requiredVolumeEth = volumeEth.muln(10).divn(15);

      expect(tx.orders).toHaveLength(1);
      expect(tx.orders[0].id).toBe(order.id);
      expect(tx.baseVolumeEth).toEqualBN(requiredVolumeEth);
      expect(maxVolumeEth(tx)).toEqualBN(volumeEth);
    });

    test('case: 2 orders - partial completion', () => {
      const orders = [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)];
      const tx = obmath.selectOrdersFor(orders, 2, toTokenDecimals(40, TokenDecimals));

      expect(tx.orders).toHaveLength(2);
      expect(tx.orders.map(o => o.id)).toEqual(['order-1', 'order-2']);

      const requiredVolumeEth = orders[0].volumeEth.add(orders[1].volumeEth.divn(2));
      expect(tx.baseVolumeEth).toEqualBN(requiredVolumeEth);
    });

    test('case: 1 order - first orders have low volume', () => {
      const orders = [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)];
      const tx = obmath.selectOrdersFor(orders, 1, toTokenDecimals(40, TokenDecimals));

      expect(tx.orders).toHaveLength(1);
      expect(tx.orders.map(o => o.id)).toEqual(['order-3']);

      const requiredVolumeEth = getOrderRemainingVolumeEth(orders[2])
        .muln(40)
        .divn(50);
      expect(tx.baseVolumeEth).toEqualBN(requiredVolumeEth);
    });
  });
});
