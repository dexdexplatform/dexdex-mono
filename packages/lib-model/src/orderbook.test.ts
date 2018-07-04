import * as ob from './orderbook';
import { Order, fromJsonOrder, computePrice, toJsonOrder } from './order';
import { BN } from 'bn.js';

let nextId = 1;
let TokenDecimals = 10;

beforeEach(() => {
  nextId = 1;
});

function createOrder(
  opts: Partial<Pick<Order, 'volume' | 'volumeEth' | 'remaining'> & { fee: BN }> = {}
): Order {
  const volume = opts.volume || new BN(10);
  const volumeEth = opts.volumeEth || new BN(1);
  const fee = opts.fee || volumeEth.muln(50).divn(10000);
  return {
    id: `order-${nextId++}`,
    token: '0x0000000000000000000000000000000000000000',
    isSell: true,
    decimals: TokenDecimals,
    volume,
    volumeEth,
    price: computePrice(volumeEth.add(fee), volume, TokenDecimals),
    remaining: opts.remaining || 1,
    ordersData: '',
  };
}

const cloneOrder = (o: Order) => fromJsonOrder(JSON.parse(JSON.stringify(toJsonOrder(o))));

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

describe('orderbook:side', () => {
  describe('addOrder()', () => {
    let sideBefore: ob.OrderBookSide;
    let o1: Order;
    let sideAfter: ob.OrderBookSide;

    beforeEach(() => {
      sideBefore = ob.newOBSide();
      // order w/price = 10
      o1 = createOrder({ volume: new BN('1'), volumeEth: new BN('10'), fee: new BN(0) });
      sideAfter = ob.addOrder(o1, ob.Sort.ASC)(sideBefore);
    });

    test('adds an order', () => {
      expect(sideAfter.orders).toHaveLength(1);
      expect(sideAfter.minVolume).not.toEqualBN(sideBefore.minVolume);
      expect(sideAfter.maxVolume).not.toEqualBN(sideBefore.maxVolume);
    });

    test('doesnt mutate existing side', () => {
      expect(sideAfter).not.toBe(sideBefore); // diff obj
      expect(sideAfter.orders).not.toBe(sideBefore.orders); // diff orders arr
    });

    test('keeps orders sorted by price', () => {
      // price = 5
      const cheapOrder = createOrder({
        volume: new BN('2'),
        volumeEth: new BN('10'),
        fee: new BN(0),
      });

      sideAfter = ob.addOrder(cheapOrder, ob.Sort.ASC)(sideAfter);

      expect(sideAfter.orders.map(o => o.id)).toEqual([cheapOrder.id, o1.id]);

      // price = 20
      const expensiveOrder = createOrder({
        volume: new BN('1'),
        volumeEth: new BN('20'),
        fee: new BN(0),
      });

      sideAfter = ob.addOrder(expensiveOrder, ob.Sort.ASC)(sideAfter);
      expect(sideAfter.orders.map(o => o.id)).toEqual([cheapOrder.id, o1.id, expensiveOrder.id]);

      // price = 15
      const middlePriceOrder = createOrder({
        volume: new BN('1'),
        volumeEth: new BN('15'),
        fee: new BN(0),
      });

      sideAfter = ob.addOrder(middlePriceOrder, ob.Sort.ASC)(sideAfter);
      expect(sideAfter.orders.map(o => o.id)).toEqual([
        cheapOrder.id,
        o1.id,
        middlePriceOrder.id,
        expensiveOrder.id,
      ]);
    });
  });

  describe('removeOrder()', () => {
    let sideBefore: ob.OrderBookSide;
    let o1: Order;

    beforeEach(() => {
      o1 = createOrder();
      sideBefore = ob.addOrder(o1, ob.Sort.ASC)(ob.newOBSide());
    });

    test('removes an order', () => {
      const sideAfter = ob.removeOrder(o1)(sideBefore);
      expect(sideAfter.orders).toHaveLength(0);
      expect(sideAfter.minVolume).toEqualBN(new BN(0));
      expect(sideAfter.maxVolume).toEqualBN(new BN(0));
    });

    test('doesnt mutate if nothing to remove', () => {
      const o2 = createOrder();
      const sideAfter = ob.removeOrder(o2)(sideBefore);
      expect(sideAfter).toBe(sideBefore);
    });

    test('doesnt mutate existing side', () => {
      const sideAfter = ob.removeOrder(o1)(sideBefore);

      // diff obj
      expect(sideAfter).not.toBe(sideBefore);
      // diff orders arr
      expect(sideAfter.orders).not.toBe(sideBefore.orders);
    });
  });

  describe('updateOrder()', () => {
    let sideBefore: ob.OrderBookSide;
    let o1: Order;

    beforeEach(() => {
      o1 = createOrder();
      sideBefore = ob.addOrder(o1, ob.Sort.ASC)(ob.newOBSide());
    });

    test('updates an order', () => {
      const o1Copy = cloneOrder(o1);
      o1Copy.remaining = 0.5;
      const sideAfter = ob.updateOrder(o1Copy)(sideBefore);
      expect(sideAfter.orders).toHaveLength(1);
      expect(sideAfter.orders[0].remaining).toBe(0.5);
    });

    test('doesnt mutate if nothing to update', () => {
      const o2 = createOrder();
      const sideAfter = ob.updateOrder(o2)(sideBefore);
      expect(sideAfter).toBe(sideBefore);
    });

    test('doesnt mutate existing side', () => {
      const o1Copy = cloneOrder(o1);
      o1Copy.remaining = 0.5;
      const sideAfter = ob.updateOrder(o1Copy)(sideBefore);

      // diff obj
      expect(sideAfter).not.toBe(sideBefore);
      // diff orders arr
      expect(sideAfter.orders).not.toBe(sideBefore.orders);
    });
  });
});

describe('orderbook', () => {
  describe('updateSide()', () => {
    test('updates the specified side only', () => {
      const book = ob.newOrderBook();

      const bookAfter = ob.updateSide(book, true)(ob.addOrder(createOrder(), ob.Sort.ASC));

      expect(bookAfter.buys).toBe(book.buys); // didnt change
      expect(bookAfter.sells).not.toBe(book.sells); // changed
      expect(bookAfter.sells.orders).toHaveLength(1);
    });

    test('doesnt mutate existing orderbook', () => {
      const book = ob.newOrderBook();

      const bookAfter = ob.updateSide(book, true)(ob.addOrder(createOrder(), ob.Sort.ASC));

      expect(bookAfter).not.toBe(book);
    });

    test('doesnt mutate if nothing changed', () => {
      const book = ob.newOrderBook();

      const bookAfter = ob.updateSide(book, true)(ob.removeOrder(createOrder()));

      expect(bookAfter).toBe(book); // nothing changed
    });
  });
});
