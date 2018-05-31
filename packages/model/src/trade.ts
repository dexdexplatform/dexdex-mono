import { BN } from 'bn.js';
import { Order, getOrdersData, getRequiredGas } from './order';
import { assert } from '@dexdex/utils/lib/assert';
import { percentage } from '@dexdex/utils/lib/bn-math';

export class Trade {
  /** The amount of extra volume already consumed (number between [0, extraVolume]) */
  readonly usedExtraVolume: BN;
  readonly maxAvailableVolume = maxAvailableVolume(this.set);
  readonly maxAvailableVolumeEth = maxAvailableVolumeEth(this.set);
  readonly requiredGas = getRequiredGas(this.set.orders);

  constructor(readonly set: OrderSet, usedExtraVolume: BN = new BN(0)) {
    this.usedExtraVolume = usedExtraVolume;
  }

  get currentVolume() {
    return this.set.baseVolume.add(this.usedExtraVolume);
  }

  get currentVolumeEth() {
    if (this.set.extraVolume.isZero()) {
      return this.set.baseVolumeEth;
    } else {
      return this.set.baseVolumeEth.add(
        this.set.extraVolumeEth.mul(this.usedExtraVolume).div(this.set.extraVolume)
      );
    }
  }

  get currentVolumeEthUpperBound() {
    // Current threshold is 5% extra
    return this.currentVolumeEth.muln(105).divn(100);
  }

  canHandle(volume: BN): boolean {
    return canHandle(this.set, volume);
  }

  changeVolume(newVolume: BN) {
    assert(this.canHandle(newVolume), `Invalid volume for Transaction: ${newVolume.toString()}`);
    return new Trade(this.set, newVolume.sub(this.set.baseVolume));
  }

  getOrderParameters() {
    return getOrdersData(this.set.orders);
  }
}

/**
 * Models a solution for a give trade operation
 */
export interface OrderSet {
  /** Selected Orders for the transaccion */
  orders: Order[];
  /** the minim volume for the transaction with the selected orders */
  baseVolume: BN;
  /** the minim volumeEth for the transaction with the selected orders */
  baseVolumeEth: BN;

  /** extra volume available with selected orders */
  extraVolume: BN;
  /** extra volumeEth available with selected orders */
  extraVolumeEth: BN;
}

export function canHandle(set: OrderSet, volume: BN) {
  return volume.gte(set.baseVolume) && volume.lte(set.baseVolume.add(set.extraVolume));
}

export function maxAvailableVolume(set: OrderSet): BN {
  return set.baseVolume.add(set.extraVolume);
}

export function maxAvailableVolumeEth(set: OrderSet): BN {
  return set.baseVolumeEth.add(set.extraVolumeEth);
}

export function getFinalVolumeEth(trade: Trade, feePercentage: number): BN {
  return percentage(1 + feePercentage, trade.currentVolumeEthUpperBound);
}
