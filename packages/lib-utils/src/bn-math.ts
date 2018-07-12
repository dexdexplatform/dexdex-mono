import BN from 'bn.js';

/**
 * Large number representing the number of decimals we support
 * We support 10 decimal places
 */
const DECIMALS = 10000000000;

/**
 * Apply Percentage to a BN.
 * Fixed decimals support
 *
 * @param per percentage value. 5 decimals supported
 * @param bn
 */
export function percentage(per: number, bn: BN) {
  return bn.mul(new BN(DECIMALS * per)).div(new BN(DECIMALS));
}

export function divCeil(numerator: BN, denominator: BN) {
  const isExact = numerator.mod(denominator).isZero();
  return isExact ? numerator.div(denominator) : numerator.div(denominator).addn(1);
}
