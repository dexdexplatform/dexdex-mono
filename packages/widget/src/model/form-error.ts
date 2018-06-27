import { BN } from 'bn.js';

import { Tradeable } from '@dexdex/model/lib/tradeable';

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
  | { code: ErrorCode.VolumeTooSmall; minVolume: BN; token: Tradeable }
  | { code: ErrorCode.VolumeTooBig; maxVolume: BN; token: Tradeable }
  | {
      code:
        | ErrorCode.NoOrders
        | ErrorCode.NotEnoughEther
        | ErrorCode.NotEnoughTokens
        | ErrorCode.CantPayNetwork;
    };
