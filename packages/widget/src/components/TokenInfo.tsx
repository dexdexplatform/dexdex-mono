import * as React from 'react';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { FormatToken } from './Format';
import { BN } from 'bn.js';

export const TokenInfo: React.SFC<{ token: Tradeable; volume: BN }> = ({ token, volume }) => (
  <div className="token-info">
    <img className="token-icon" src="golem.png" alt="DAI Token Icon" />
    <p className="token-amount">
      <FormatToken value={volume} token={token} />
    </p>
    <p className="token-name">{token.name}</p>
  </div>
);
