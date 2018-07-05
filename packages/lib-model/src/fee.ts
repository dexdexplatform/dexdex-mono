import { Operation } from './base';
import { BN } from 'bn.js';

export function applyFee(operation: Operation, volumeEth: BN, feeParts: number): BN {
  return volumeEth.muln(operation === 'buy' ? 10000 + feeParts : 10000 - feeParts).divn(10000);
}

export function feeFromVolumeEthWithFee(
  operation: Operation,
  volumeEthWithFee: BN,
  feeParts: number
): BN {
  /*
   vol_fee = vol * (10000 +/- feeParts) / 10000
    => vol = vol_fee * 10000 / (10000 +/- feeParts)

    fee = vol * feeParts / 10000
    fee = ( vol_fee * 10000 / (10000 +/- feeParts) )  * feeParts / 10000
    fee = vol_fee * feeParts / (10000 +/- feeParts)
  */
  return volumeEthWithFee
    .muln(feeParts)
    .divn(operation === 'buy' ? 10000 + feeParts : 10000 - feeParts);
}
