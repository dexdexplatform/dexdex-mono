import { Token } from '@dexdex/model/lib/token';
import BN from 'bn.js';
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

export const TokenInfo: React.SFC<{ token: Token }> = ({ token }) => (
  <div className={classes.tokenInfo}>
    <TokenImage token={token} />
    <div className={classNames(classes.tokenName)}>
      {token.name} ({token.symbol})
    </div>
  </div>
);

export const TradeInfo: React.SFC<{
  token: Token;
  volume: BN;
  volumeEth: BN;
  inProgress?: boolean;
  operation: Operation;
}> = ({ token, volume, volumeEth, inProgress, operation }) => {
  const ethSide = {
    value: <FormatEth value={volumeEth} />,
    image: <SafeImage src={tokenSmallImg('ETH')} fallback={tokenDefaultSmallImg} alt="ETH" />,
    unit: 'Ether (ETH)',
  };
  const tokenSide = {
    value: <FormatToken value={volume} token={token} />,
    image: (
      <SafeImage
        src={tokenSmallImg(token.address)}
        fallback={tokenDefaultSmallImg}
        alt={`${token.symbol}`}
      />
    ),
    unit: `${token.name} (${token.symbol})`,
  };

  const sides =
    operation === 'buy' ? { buy: ethSide, sell: tokenSide } : { buy: tokenSide, sell: ethSide };

  return (
    <div>
      <div className={classes.tradeSide}>
        {sides.buy.image}
        <div className={classes.amount}>
          <div>{inProgress ? 'Exchanging...' : 'Exchanged'}</div>
          <div>{sides.buy.value}</div>
          <div>{sides.buy.unit}</div>
        </div>
      </div>
      <div className={classes.tradeSide}>
        {sides.sell.image}
        <div className={classes.amount}>
          <div>{inProgress ? 'Will Receive...' : 'Received'}</div>
          <div>{sides.sell.value}</div>
          <div>{sides.sell.unit}</div>
        </div>
      </div>
    </div>
  );
};
