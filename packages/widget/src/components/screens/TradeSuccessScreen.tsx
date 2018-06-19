import { Address, Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { BN } from 'bn.js';
import * as React from 'react';
import { RenderMapper } from '.';
import { WalletInfo } from '../../model/wallets/index';
import {
  effectiveVolume,
  effectiveVolumeEth,
  getCurrentAccountState,
  networkCost,
} from '../../model/widget-state/selectors';
import { FormatAddress, FormatEth, FormatPrice, FormatToken, FormatTxHash } from '../Format';
import { tokenBigImg } from '../../config';

const ItemList: React.SFC = ({ children }) => (
  <ul className="transacion-details-list">{children}</ul>
);

const Item: React.SFC<{ kind?: 'title' | 'total'; title: string }> = ({
  kind,
  title,
  children,
}) => (
  <li className={kind ? kind : ''}>
    <div className="label">{title}</div>
    <div className="value">{children}</div>
  </li>
);

export interface TradeSuccessScreenProps {
  operation: Operation;
  tradeable: Tradeable;
  amount: string;
  fromAddress: Address;
  effectiveVolume: BN;
  effectiveVolumeEth: BN;
  networkCost: BN | null;
  tradeTxHash: string;
  wallet: WalletInfo;
}

export const mapper: RenderMapper<TradeSuccessScreenProps> = store => ws => {
  const accountState = getCurrentAccountState(ws);
  if (ws.tradeExecution.tradeTxHash == null) {
    throw new Error('BUG: no tradetxhash on success screen');
  }
  if (accountState == null) {
    throw new Error('BUG: no wallet address on success screen');
  }
  if (ws.selectedWallet == null) {
    throw new Error('BUG: no selected wallet on success screen');
  }
  return {
    tradeable: ws.tradeable,
    fromAddress: accountState.address,
    amount: ws.amount,
    operation: ws.operation,
    effectiveVolume: effectiveVolume(ws),
    effectiveVolumeEth: effectiveVolumeEth(ws),
    networkCost: networkCost(ws),
    tradeTxHash: ws.tradeExecution.tradeTxHash,
    wallet: WalletInfo[ws.selectedWallet.wallet],
  };
};

const TradeSuccessScreen: React.SFC<TradeSuccessScreenProps> = props => (
  <div className="widget-status">
    <h1 className="step-title">Total {props.operation === 'buy' ? 'Obtained' : 'Sent'}</h1>
    <div className="token-info">
      <img className="token-icon" src={tokenBigImg(props.tradeable.symbol)} alt="Token Icon" />
      <p className="token-amount">
        <FormatToken value={props.effectiveVolume} token={props.tradeable} />
      </p>
      <p className="token-name">
        {props.tradeable.name} ({props.tradeable.symbol})
      </p>
    </div>

    <ItemList>
      <Item kind="title" title={`Transaction details`}>
        <div className="value">May-21-2018 07:36:55 AM +UTC</div>
      </Item>
      <Item title="Account">
        <FormatAddress className="wallet-address" value={props.fromAddress} />
      </Item>
      <Item title="Transaction">
        <FormatTxHash className="link" value={props.tradeTxHash} />
      </Item>
      <Item title={`Amount ${props.operation === 'buy' ? 'Obtained' : 'Sent'}`}>
        <FormatToken value={props.effectiveVolume} token={props.tradeable} />
      </Item>
      <Item title={`${props.tradeable.symbol} Price`}>
        <FormatPrice
          volume={props.effectiveVolume}
          volumeEth={props.effectiveVolumeEth}
          token={props.tradeable}
        />{' '}
        ETH
      </Item>
      <Item title="Network Cost">
        <FormatEth value={props.networkCost} /> ETH
      </Item>
      {/* <li>
        <div className="label">Service Fee</div>
        <div className="value">COMPUTE THIS</div>
      </li>
      <li>
        <div className="label">Price Optimization</div>
        <div className="value">Price Optimization %</div>
      </li> */}
      <Item kind="total" title={`Total ${props.operation === 'buy' ? 'Sent' : 'Obtained'}`}>
        <FormatEth value={props.effectiveVolumeEth} /> ETH
      </Item>
    </ItemList>
  </div>
);

export { TradeSuccessScreen as Screen };
