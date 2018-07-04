import { BN } from 'bn.js';
import { OrderSelection, volumeEthFor } from './order-selection';

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

describe('volumeEthFor()', () => {
  const tx: OrderSelection = {
    baseVolume: new BN(1000000),
    baseVolumeEth: new BN(200000),
    extraVolume: new BN(5000),
    extraVolumeEth: new BN(10000),
    orders: [],
  };

  test('consume all extraVolume', () => {
    expect(volumeEthFor(tx, new BN(1005000))).toEqualBN(new BN(210000));
  });

  test('NO extraVolume', () => {
    expect(volumeEthFor(tx, new BN(1000000))).toEqualBN(new BN(200000));
  });
});
