import { BN } from 'bn.js';
import { Trade } from './trade';

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

describe('Trade', () => {
  test('consume ALL extraVolume', () => {
    let tx = new Trade({
      baseVolume: new BN(1000000),
      baseVolumeEth: new BN(200000),
      extraVolume: new BN(5000),
      extraVolumeEth: new BN(10000),
      orders: [],
    });

    // We start with current == required
    expect(tx.currentVolume).toEqualBN(tx.set.baseVolume);
    expect(tx.currentVolumeEth).toEqualBN(tx.set.baseVolumeEth);

    // Consume Total extra space
    tx = tx.changeVolume(tx.currentVolume.add(tx.set.extraVolume));

    expect(tx.currentVolume).toEqualBN(tx.set.baseVolume.add(tx.set.extraVolume));
    expect(tx.currentVolumeEth).toEqualBN(tx.set.baseVolumeEth.add(tx.set.extraVolumeEth));
  });
  test('NO extraVolume', () => {
    const tx = new Trade({
      baseVolume: new BN(1000000),
      baseVolumeEth: new BN(200000),
      extraVolume: new BN(0),
      extraVolumeEth: new BN(0),
      orders: [],
    });

    // We start with current == required
    expect(tx.currentVolume).toEqualBN(tx.set.baseVolume);
    expect(tx.currentVolumeEth).toEqualBN(tx.set.baseVolumeEth);
    expect(tx.maxAvailableVolume).toEqualBN(tx.set.baseVolume);
    expect(tx.maxAvailableVolumeEth).toEqualBN(tx.set.baseVolumeEth);
  });
});
