import { BN } from 'bn.js';
import { fromWei, numberToString } from 'ethjs-unit';

export { fromWei, toWei } from 'ethjs-unit';

const DecimalsMap: Record<string, string> = {
  0: '1',
  1: '10',
  2: '100',
  3: '1000',
  4: '10000',
  5: '100000',
  6: '1000000',
  7: '10000000',
  8: '100000000',
  9: '1000000000',
  10: '10000000000',
  11: '100000000000',
  12: '1000000000000',
  13: '10000000000000',
  14: '100000000000000',
  15: '1000000000000000',
  16: '10000000000000000',
  17: '100000000000000000',
  18: '1000000000000000000',
};

const zero = new BN(0);
const negative1 = new BN(-1);

function validateDecimals(tokenDecimals: number) {
  if (tokenDecimals > 18 || tokenDecimals < 0) {
    throw new Error('Invalid decimal number: ' + tokenDecimals);
  }
}

export function getDecimalBase(tokenDecimals: number): BN {
  validateDecimals(tokenDecimals);
  return new BN(DecimalsMap[tokenDecimals]);
}

export function toTokenDecimals(value: string | number | BN, tokenDecimals: number): BN {
  validateDecimals(tokenDecimals);

  let valueStr = numberToString(value);
  const base = new BN(DecimalsMap[tokenDecimals]);
  const baseLength = DecimalsMap[tokenDecimals].length - 1 || 1;

  // Is it negative?
  const negative = valueStr.substring(0, 1) === '-';
  if (negative) {
    valueStr = valueStr.substring(1);
  }

  if (valueStr === '.') {
    throw new Error(`[ethjs-unit] while converting number ${value} to wei, invalid value`);
  }

  // Split it into a whole and fractional part
  const comps = valueStr.split('.'); // eslint-disable-line
  if (comps.length > 2) {
    throw new Error(
      `[ethjs-unit] while converting number ${value} to wei,  too many decimal points`
    );
  }

  const whole = comps[0] ? comps[0] : '0';
  let fraction = comps[1] ? comps[1] : '0';

  if (fraction.length > baseLength) {
    throw new Error(
      `[ethjs-unit] while converting number ${valueStr} to wei, too many decimal places`
    );
  }

  while (fraction.length < baseLength) {
    fraction += '0';
  }

  let wei = new BN(whole).mul(base).add(new BN(fraction));

  if (negative) {
    wei = wei.mul(negative1);
  }

  // TODO why is this?? we should return wei!
  return new BN(wei.toString(10), 10);
}

export function fromTokenDecimals(value: BN, tokenDecimals: number): string {
  validateDecimals(tokenDecimals);

  const negative = value.lt(zero);
  const base = new BN(DecimalsMap[tokenDecimals]);
  const baseLength = DecimalsMap[tokenDecimals].length - 1 || 1;

  if (negative) {
    value = value.mul(negative1);
  }

  let fraction = value.mod(base).toString(10);

  // Add prefix 0 to complete decimals length
  while (fraction.length < baseLength) {
    fraction = `0${fraction}`;
  }

  const whole = value.div(base).toString(10);

  return `${negative ? '-' : ''}${whole}${fraction === '0' ? '' : `.${fraction}`}`;
}

export const toEther = (wei: BN) => fromWei(wei, 'ether');
