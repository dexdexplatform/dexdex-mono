import { BN } from 'bn.js';

import { Token } from '@dexdex/model/lib/token';

export enum ErrorCode {
  VolumeBadFormat = 'VolumeBadFormat',
  VolumeTooSmall = 'VolumeTooSmall',
  VolumeTooBig = 'VolumeTooBig',
  NotEnoughEther = 'NotEnoughEther',
  NotEnoughTokens = 'NotEnoughTokens',
  CantPayNetwork = 'CantPayNetwork',
  NoOrders = 'NoOrders',
}

export type AmountError =
  | ErrorCode.VolumeTooBig
  | ErrorCode.VolumeTooSmall
  | ErrorCode.VolumeBadFormat
  | ErrorCode.NoOrders;

export type BalanceError =
  | ErrorCode.CantPayNetwork
  | ErrorCode.NotEnoughEther
  | ErrorCode.NotEnoughTokens;

export type ErrorMessage =
  | { code: ErrorCode.VolumeBadFormat }
  | { code: ErrorCode.VolumeTooSmall; minVolume: BN; token: Token }
  | { code: ErrorCode.VolumeTooBig; maxVolume: BN; token: Token }
  | {
      code:
        | ErrorCode.NoOrders
        | ErrorCode.NotEnoughEther
        | ErrorCode.NotEnoughTokens
        | ErrorCode.CantPayNetwork;
    };
