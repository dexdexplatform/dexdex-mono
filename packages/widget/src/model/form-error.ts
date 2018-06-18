import { BN } from 'bn.js';

import { Tradeable } from '@dexdex/model/lib/tradeable';

export enum ErrorCode {
  VolumeBadFormat = 'VolumeBadFormat',
  VolumeTooSmall = 'VolumeTooSmall',
  VolumeTooBig = 'VolumeTooBig',
  InsufficientFunds = 'InsufficientFunds',
  CantPayNetwork = 'CantPayNetwork',
}

export type ErrorMessage =
  | { code: ErrorCode.VolumeBadFormat }
  | { code: ErrorCode.VolumeTooSmall; minVolume: BN; token: Tradeable }
  | { code: ErrorCode.VolumeTooBig; maxVolume: BN; token: Tradeable }
  | { code: ErrorCode.InsufficientFunds }
  | { code: ErrorCode.CantPayNetwork };

export const isAmountError = (errMsg: ErrorMessage) =>
  [ErrorCode.VolumeTooSmall, ErrorCode.VolumeTooBig].indexOf(errMsg.code) >= 0;

export const isBalanceError = (errMsg: ErrorMessage) =>
  [ErrorCode.InsufficientFunds, ErrorCode.CantPayNetwork].indexOf(errMsg.code) >= 0;
