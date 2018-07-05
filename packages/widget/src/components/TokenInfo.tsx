import { Token } from '@dexdex/model/lib/token';
import { BN } from 'bn.js';
import classNames from 'classnames';
import * as React from 'react';
import { tokenBigImg, tokenDefaultBigImg, tokenDefaultSmallImg, tokenSmallImg } from '../config';
import { FormatEth, FormatToken } from './Format';
import { SafeImage } from './ImageLoader';
import { Operation } from '@dexdex/model/lib/base';

const classes = require('./TokenInfo.css');

// const exchangeImgSrc = require('./icons/exchange.svg');

const TokenImage: React.SFC<{ token: Token }> = ({ token }) => (
  <div className={classes.tokenImage}>
    <SafeImage
      src={tokenBigImg(token.address)}
      fallback={tokenDefaultBigImg}
      alt={`${token.symbol}`}
    />
  </div>
);

const TokenAmount: React.SFC<{ className?: string; token?: Token; value: BN }> = ({
  className,
  token,
  value,
}) => (
  <div className={classNames(className, classes.tokenAmount)}>
    <p className={classes.value}>
      {token ? <FormatToken value={value} token={token} /> : <FormatEth value={value} />}
    </p>
    <p className={classes.name}>{token ? `${token.name} (${token.symbol})` : 'Ether (Eth)'}</p>
  </div>
);

export const TokenInfo: React.SFC<{ token: Token; volume: BN }> = ({ token, volume }) => (
  <div className={classes.tokenInfo}>
    <TokenImage token={token} />
    <TokenAmount value={volume} token={token} />
  </div>
);

export const TradeInfo: React.SFC<{
  token: Token;
  volume: BN;
  volumeEth: BN;
  inProgress?: boolean;
  operation: Operation;
}> = ({ token, volume, volumeEth, inProgress, operation }) => (
  <div>
    <div className={classes.tradeSide}>
      <SafeImage
        src={tokenSmallImg(token.address)}
        fallback={tokenDefaultSmallImg}
        alt={`${token.symbol}`}
      />
      <div className={classes.amount}>
        <div>{inProgress ? 'Exchanging...' : 'Exchanged'}</div>
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
    <div className={classes.tradeSide}>
      <SafeImage
        src={tokenSmallImg('ETH')}
        fallback={tokenDefaultSmallImg}
        alt={`${token.symbol}`}
      />
      <div className={classes.amount}>
        <div>{inProgress ? 'Will Receive...' : 'Received'}</div>
        <div>
          {operation === 'buy' ? (
            <FormatToken value={volume} token={token} />
          ) : (
            <FormatEth value={volumeEth} />
          )}
        </div>
        <div>{operation === 'buy' ? `${token.name} (${token.symbol})` : 'Ether (ETH)'}</div>
      </div>
    </div>
  </div>
);
