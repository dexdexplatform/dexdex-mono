import * as React from 'react';
import { Tradeable } from '@dexdex/model/lib/tradeable';

export const TokenInfo: React.SFC<{ token: Tradeable; volume: string }> = ({ token, volume }) => (
  <div className="token-info">
    <img className="token-icon" src="golem.png" alt="DAI Token Icon" />
    <p className="token-amount">{volume}</p>
    <p className="token-name">{token.name}</p>
  </div>
);
