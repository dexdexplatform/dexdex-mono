declare module 'ethjs-unit' {
  import { BN } from 'bn.js';
  export type EthUnit =
    | 'wei'
    | 'kwei'
    | 'Kwei'
    | 'babbage'
    | 'femtoether'
    | 'mwei'
    | 'Mwei'
    | 'lovelace'
    | 'picoether'
    | 'gwei'
    | 'Gwei'
    | 'shannon'
    | 'nanoether'
    | 'nano'
    | 'szabo'
    | 'microether'
    | 'micro'
    | 'finney'
    | 'milliether'
    | 'milli'
    | 'ether'
    | 'kether'
    | 'grand'
    | 'mether'
    | 'gether'
    | 'tether';

  // wei is a number 18 digits
  const MAX_DECIMALS = 18;

  /**
   * Converts a value (expressed in unit) to wei.
   *
   * @param value value expressed in 'unit'
   * @param unit unit for value
   */
  export function toWei(value: string | number | BN, unit: EthUnit): BN;

  /**
   * Converts a value in wei to specified unit.
   * @param value value in wei
   * @param unit unit to convert to
   */
  export function fromWei(value: string | number | BN, unit: EthUnit): string;
  export function numberToString(n: number | string | BN): string;
}
