import { Operation } from './base';
import BN from 'bn.js';
import { divCeil } from '../../../node_modules/@dexdex/utils/lib/bn-math';

export function applyFee(operation: Operation, volumeEth: BN, feeParts: number): BN {
  if (operation === 'buy') {
    // If the number is not exact, we do [ceil], we need to overestimate the fee (and fee is adding)
    return divCeil(volumeEth.muln(10000 + feeParts), new BN(10000));
  } else {
    // If the number is not exact, we do [floor], we need to overestimate the fee (and fee is substracting)
    return volumeEth.muln(10000 - feeParts).divn(10000);
  }
}

export function feeFromVolumeEthWithFee(
  operation: Operation,
  volumeEthWithFee: BN,
  feeParts: number
): BN {
  /*
  To get vol:
  vol_fee = vol * (10000 +/- feeParts) / 10000
    => vol = vol_fee * 10000 / (10000 +/- feeParts)

  Also:
  fee = vol * feeParts / 10000

  replace vol by it's formula...
  fee = ( vol_fee * 10000 / (10000 +/- feeParts) )  * feeParts / 10000
  fee = vol_fee * feeParts / (10000 +/- feeParts)
  */
  return volumeEthWithFee
    .muln(feeParts)
    .divn(operation === 'buy' ? 10000 + feeParts : 10000 - feeParts);
}
