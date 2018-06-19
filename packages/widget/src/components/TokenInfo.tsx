import * as React from 'react';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { FormatToken } from './Format';
import { BN } from 'bn.js';
import { tokenBigImg } from '../config';

const exchangeImgSrc = require('./icons/exchange.png');

export const TokenInfo: React.SFC<{ token: Tradeable; volume: BN }> = ({ token, volume }) => (
  <div className="token-info">
    <img className="token-icon" src={tokenBigImg(token.symbol)} alt="Token Icon" />
    <p className="token-amount">
      <FormatToken value={volume} token={token} />
    </p>
    <p className="token-name">
      {token.name} ({token.symbol})
    </p>
    <div className="token-trade">
      <div className="left col">
        <p className="token-amount">
          <FormatToken value={volume} token={token} />
        </p>
        <p className="token-name">
          {token.name} ({token.symbol})
        </p>
      </div>
      <div className="middle col">
        <img src={exchangeImgSrc} />
      </div>
      <div className="right col">
        <p className="token-amount">
          <FormatToken value={volume} token={token} />
        </p>
        <p className="token-name">
          {token.name} ({token.symbol})
        </p>
      </div>
    </div>
  </div>
);
