import { BN } from 'bn.js';
import * as units from './units';

describe('units', () => {
  test('fromTokenDecimals()', () => {
    expect(units.fromTokenDecimals(new BN('10000'), 2)).toEqual('100.00');
    expect(units.fromTokenDecimals(new BN('10000'), 5)).toEqual('0.10000');
    expect(units.fromTokenDecimals(new BN('10000'), 6)).toEqual('0.010000');
    expect(units.fromTokenDecimals(new BN('1'), 2)).toEqual('0.01');
  });
  test('toTokenDecimals()', () => {
    expect(units.toTokenDecimals('100.00', 2)).toEqual(new BN('10000'));
    expect(units.toTokenDecimals('0.10000', 5)).toEqual(new BN('10000'));
    expect(units.toTokenDecimals('0.010000', 6)).toEqual(new BN('10000'));
    expect(units.toTokenDecimals('0.01', 2)).toEqual(new BN('1'));
  });

  describe('changeDecimals()', () => {
    const defTest = (
      name: string,
      o: {
        value: string;
        td: number;
        od: number;
        mode: units.DivMode;
        expected: string;
      }
    ) =>
      test(name, () =>
        expect(units.changeDecimals(new BN(o.value), o.td, o.od, o.mode)).toEqual(o.expected)
      );

    defTest('output decimals equal than token decimals', {
      value: '10000',
      td: 2,
      od: 2,
      mode: units.DivMode.Floor,
      expected: '100.00',
    });

    defTest('output decimals bigger than token decimals', {
      value: '10000',
      td: 2,
      od: 9,
      mode: units.DivMode.Floor,
      expected: '100.00',
    });

    defTest('output decimals bigger than token decimals', {
      value: '10000',
      td: 2,
      od: 9,
      mode: units.DivMode.Floor,
      expected: '100.00',
    });

    defTest('floor simple', {
      value: '1899999',
      td: 4,
      od: 3,
      mode: units.DivMode.Floor,
      expected: '189.999',
    });
    defTest('round simple', {
      value: '1899999',
      td: 4,
      od: 3,
      mode: units.DivMode.Round,
      expected: '190.000',
    });

    defTest('round limits', {
      value: '1855556',
      td: 4,
      od: 2,
      mode: units.DivMode.Round,
      expected: '185.56',
    });

    defTest('ceil simple', {
      value: '1855501',
      td: 4,
      od: 2,
      mode: units.DivMode.Ceil,
      expected: '185.56',
    });

    defTest('ceil with rest=0', {
      value: '1855500',
      td: 4,
      od: 2,
      mode: units.DivMode.Ceil,
      expected: '185.55',
    });
  });
});
