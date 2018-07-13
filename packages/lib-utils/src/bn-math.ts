import BN from 'bn.js';

export function divCeil(numerator: BN, denominator: BN) {
  const isExact = numerator.mod(denominator).isZero();
  return isExact ? numerator.div(denominator) : numerator.div(denominator).addn(1);
}
