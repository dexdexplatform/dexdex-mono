import { BN } from 'bn.js';
import * as units from './units';

describe('units', () => {
  test('toToken()', () => {
    expect(units.fromTokenDecimals(new BN('10000'), 2)).toEqual('100.00');
    expect(units.fromTokenDecimals(new BN('10000'), 5)).toEqual('0.10000');
    expect(units.fromTokenDecimals(new BN('10000'), 6)).toEqual('0.010000');
    expect(units.fromTokenDecimals(new BN('1'), 2)).toEqual('0.01');
  });
  test('fromToken()', () => {
    expect(units.toTokenDecimals('100.00', 2)).toEqual(new BN('10000'));
    expect(units.toTokenDecimals('0.10000', 5)).toEqual(new BN('10000'));
    expect(units.toTokenDecimals('0.010000', 6)).toEqual(new BN('10000'));
    expect(units.toTokenDecimals('0.01', 2)).toEqual(new BN('1'));
  });
});
