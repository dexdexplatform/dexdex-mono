import { fromTokenDecimals, toTokenDecimals, toWei } from '@dexdex/utils/lib/units';
import BN from 'bn.js';
import * as obmath from './ob-math';
import { computePrice, Order } from './order';
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

function createOrder(opts: Pick<Order, 'remainingVolume' | 'remainingVolumeEth'>): Order {
  const remainingVolume = opts.remainingVolume;
  const remainingVolumeEth = opts.remainingVolumeEth;

  return {
    id: `order-${nextId++}`,
    token: '0x0000000000000000000000000000000000000000',
    maker: `0x00000000000000000000000000000000${nextId}`,
    isSell: true,
    decimals: TokenDecimals,
    remainingVolume,
    remainingVolumeEth,
    price: computePrice(remainingVolumeEth, remainingVolume, TokenDecimals),
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

function sellOrderED(tokens: number, ether: number) {
  const remainingVolume = toTokenDecimals(tokens, TokenDecimals);
  const remainingVolumeEth = toWei(ether, 'ether')
    .muln(1003)
    .divn(1000);
  return createOrder({
    remainingVolume,
    remainingVolumeEth,
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

  describe('getMaxVolume() repeatead maker', () => {
    test('simple case', () => {
      const repeatedMakerOrder = sellOrderED(30, 5);
      const maxVolume = obmath.getMaxVolume(
        [repeatedMakerOrder, sellOrderED(20, 10), sellOrderED(50, 30), repeatedMakerOrder],
        3
      );
      expect(Number(fromTokenDecimals(maxVolume, TokenDecimals))).toBe(100);
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
      const remainingVolumeEth = order.remainingVolumeEth;
      const requiredVolumeEth = remainingVolumeEth.muln(20).divn(30);

      expect(tx.baseVolumeEth).toEqualBN(requiredVolumeEth);

      // this selection is valid until we reach 30 tokens (max volume)
      expect(maxVolume(tx)).toEqualBN(toTokenDecimals(30, TokenDecimals));
      expect(maxVolumeEth(tx)).toEqualBN(remainingVolumeEth);
    });

    test('case: 2 orders - partial completion', () => {
      const orders = [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)];
      const tx = obmath.selectOrdersFor(orders, 2, toTokenDecimals(40, TokenDecimals));

      expect(tx.orders).toHaveLength(2);
      expect(tx.orders.map(o => o.id)).toEqual(['order-1', 'order-2']);

      const requiredVolumeEth = orders[0].remainingVolumeEth.add(
        orders[1].remainingVolumeEth.divn(2)
      );
      expect(tx.baseVolumeEth).toEqualBN(requiredVolumeEth);
    });

    test('case: 1 order - first orders have low volume', () => {
      const orders = [sellOrderED(30, 5), sellOrderED(20, 10), sellOrderED(50, 30)];
      const tx = obmath.selectOrdersFor(orders, 1, toTokenDecimals(40, TokenDecimals));

      expect(tx.orders).toHaveLength(1);
      expect(tx.orders.map(o => o.id)).toEqual(['order-3']);

      const requiredVolumeEth = orders[2].remainingVolumeEth.muln(40).divn(50);
      expect(tx.baseVolumeEth).toEqualBN(requiredVolumeEth);
    });
  });
});
