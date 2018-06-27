import * as React from 'react';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { FormatToken, FormatEth } from './Format';
import { BN } from 'bn.js';
import { tokenBigImg, tokenDefaultBigImg } from '../config';
import classNames from 'classnames';
import { SafeImage } from './ImageLoader';

const exchangeImgSrc = require('./icons/exchange.svg');

const TokenImage: React.SFC<{ token: Tradeable }> = ({ token }) => (
  <div className="token-big-icon">
    <SafeImage
      src={tokenBigImg(token.symbol)}
      fallback={tokenDefaultBigImg}
      alt={`${token.symbol}`}
    />
  </div>
);

const TokenAmount: React.SFC<{ className?: string; token?: Tradeable; value: BN }> = ({
  className,
  token,
  value,
}) => (
  <div className={classNames(className, 'token-amount')}>
    <p className="token-amount-value">
      {token ? <FormatToken value={value} token={token} /> : <FormatEth value={value} />}
    </p>
    <p className="token-amount-name">{token ? `${token.name} (${token.symbol})` : 'Ether (Eth)'}</p>
  </div>
);

export const TokenInfo: React.SFC<{ token: Tradeable; volume: BN }> = ({ token, volume }) => (
  <div className="token-info">
    <TokenImage token={token} />
    <TokenAmount value={volume} token={token} />
  </div>
);

export const TradeInfo: React.SFC<{ token: Tradeable; volume: BN; volumeEth: BN }> = ({
  token,
  volume,
  volumeEth,
}) => (
  <div className="trade-info">
    <TokenImage token={token} />
    <div className="trade-details">
      <TokenAmount className="trade-details-left" value={volume} token={token} />
      <div className="trade-details-middle">
        <img src={exchangeImgSrc} />
      </div>
      <TokenAmount className="trade-details-right" value={volumeEth} />
    </div>
  </div>
);
