import { divCeil } from './bn-math';
import BN from 'bn.js';

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

test('divCeil on inexact divison', () => {
  // regular division truncates (floor)
  expect(new BN(3).div(new BN(7))).toEqualBN(new BN(0));
  // ceil division adds 1 (floor)
  expect(divCeil(new BN(3), new BN(7))).toEqualBN(new BN(1));
});

test('divCeil on exact divison', () => {
  expect(divCeil(new BN(6), new BN(3))).toEqualBN(new BN(6).div(new BN(3)));
});
