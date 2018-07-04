import { BN } from 'bn.js';
import { Order } from './order';

/**
 * Models a selection of orders that are the response to the question
 * "Which are the best orders to do this trade"?
 *
 * Contains the selected orders for the trade, alongside the volume & volumeEth range these orders
 * can handle while still being the best choice for a trade
 */
export interface OrderSelection {
  /** Orders selected for the trade */
  orders: Order[];

  /** Minimum volume for which selected orders are the best solution */
  baseVolume: BN;
  /** Minimum volumeEth for which selected orders are the best solution */
  baseVolumeEth: BN;
  /** Extra volume available with which selected orders are the best solution */
  extraVolume: BN;
  /** Extra volumeEth available with which selected orders are the best solution */
  extraVolumeEth: BN;
}

/**
 * Computes the Ether volume required to fill the OrderSelection with
 * a given volume.
 *
 * @param volume Token volume to fill. Must be between [os.baseVolume, os.baseVolume+os.extraVolume]
 */
export function volumeEthFor(orderSel: OrderSelection, volume: BN) {
  if (volume.eq(orderSel.baseVolume)) {
    return orderSel.baseVolumeEth;
  } else {
    const usedExtraVolume = volume.sub(orderSel.baseVolume);
    if (usedExtraVolume.gt(orderSel.extraVolume)) {
      throw new Error(`Invalid volume for TradePlan: ${volume}`);
    }
    const usedExtraVolumEth = orderSel.extraVolumeEth
      .mul(usedExtraVolume)
      .div(orderSel.extraVolume);
    return orderSel.baseVolumeEth.add(usedExtraVolumEth);
  }
}

/**
 * Same as `volumeEthFor` but also add the DexDex Fee to it.
 *
 * @param orderSel OrderSelection
 * @param volume Token Volume
 * @param feeParts fee expressed in parts / 10000
 */
export function getFinalVolumeEth(orderSel: OrderSelection, volume: BN, feeParts: number): BN {
  return volumeEthFor(orderSel, volume)
    .muln(10000 + feeParts)
    .divn(10000);
}

/**
 * Indicates wether the given OrderSelection is the optimal selection
 * to buy/sell the specified volume
 */
export function canHandle(orderSel: OrderSelection, volume: BN) {
  return (
    volume.gte(orderSel.baseVolume) && volume.lte(orderSel.baseVolume.add(orderSel.extraVolume))
  );
}

export function maxAvailableVolume(orderSel: OrderSelection): BN {
  return orderSel.baseVolume.add(orderSel.extraVolume);
}

export function maxAvailableVolumeEth(orderSel: OrderSelection): BN {
  return orderSel.baseVolumeEth.add(orderSel.extraVolumeEth);
}
