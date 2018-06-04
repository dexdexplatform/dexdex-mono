import { removeExtraZeros } from './format';

describe('removeExtraZeros', () => {
  const removeExtraZerosTest = (val: string, expected: string) => {
    test(`removeExtraZeros(${val}) === ${expected}`, () => {
      expect(removeExtraZeros(val)).toBe(expected);
    });
  };

  removeExtraZerosTest('1', '1');
  removeExtraZerosTest('0', '0');
  removeExtraZerosTest('0.0', '0');
  removeExtraZerosTest('1.0', '1');
  removeExtraZerosTest('1.10', '1.1');
  removeExtraZerosTest('1.0001000', '1.0001');
});
