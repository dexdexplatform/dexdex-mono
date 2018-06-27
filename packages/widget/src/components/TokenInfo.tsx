import { Tradeable } from '@dexdex/model/lib/tradeable';
import { BN } from 'bn.js';
import classNames from 'classnames';
import * as React from 'react';
import { tokenBigImg, tokenDefaultBigImg, tokenDefaultSmallImg, tokenSmallImg } from '../config';
import { FormatEth, FormatToken } from './Format';
import { SafeImage } from './ImageLoader';
import { Operation } from '@dexdex/model/lib/base';

// const exchangeImgSrc = require('./icons/exchange.svg');

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

export const TradeInfo: React.SFC<{
  token: Tradeable;
  volume: BN;
  volumeEth: BN;
  inProgress?: boolean;
  operation: Operation;
}> = ({ token, volume, volumeEth, inProgress, operation }) => (
  <div className="trade-info">
    <div className="trade-info-section">
      <div className="trade-info-details">
        <SafeImage
          src={tokenSmallImg(token.symbol)}
          fallback={tokenDefaultSmallImg}
          alt={`${token.symbol}`}
        />
        <div className="trade-info-token-amount">
          <div className="trade-info-section-title">
            {inProgress ? 'Exchanging...' : 'Exchanged'}
          </div>
          <div>
            {operation === 'buy' ? (
              <FormatEth value={volumeEth} />
            ) : (
              <FormatToken value={volume} token={token} />
            )}
          </div>
          <div>{operation === 'buy' ? 'Ether (ETH)' : `${token.name} (${token.symbol})`}</div>
        </div>
      </div>
    </div>
    <div className="trade-info-section">
      <div className="trade-info-details">
        <SafeImage
          src={tokenSmallImg('ETH')}
          fallback={tokenDefaultSmallImg}
          alt={`${token.symbol}`}
        />
        <div className="trade-info-token-amount">
          <div className="trade-info-section-title">
            {inProgress ? 'Will Receive...' : 'Received'}
          </div>
          <div>
            {operation === 'buy' ? (
              <FormatToken value={volume} token={token} />
            ) : (
              <FormatEth value={volumeEth} />
            )}
            <FormatEth value={volumeEth} />
          </div>
          <div>{operation === 'buy' ? `${token.name} (${token.symbol})` : 'Ether (ETH)'}</div>
        </div>
      </div>
    </div>
  </div>
);
