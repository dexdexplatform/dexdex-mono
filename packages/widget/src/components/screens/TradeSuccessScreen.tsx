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
import { TokenInfo } from '../TokenInfo';

const ItemList: React.SFC = ({ children }) => <ul className="item-list">{children}</ul>;

const Item: React.SFC<{ kind?: 'title' | 'total'; title: string }> = ({
  kind,
  title,
  children,
}) => (
  <li className={kind ? `item-list-${kind}` : ''}>
    <div className="item-list-label">{title}</div>
    <div className="item-list-value">{children}</div>
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
  <div className="info-screen">
    <h1 className="info-screen-title">
      {props.operation === 'buy' ? 'Total Obtained' : 'Total Sent'}
    </h1>
    <div className="info-screen-header">
      <TokenInfo token={props.tradeable} volume={props.effectiveVolume} />
    </div>
    <div className="info-screen-content">
      <ItemList>
        <Item kind="title" title={`Transaction details`}>
          <div className="value">May-21-2018 07:36:55 AM +UTC</div>
        </Item>
        <Item title="Account">
          <FormatAddress className="trade-success-address" value={props.fromAddress} />
        </Item>
        <Item title="Transaction">
          <FormatTxHash className="trade-success-txhash" value={props.tradeTxHash} />
        </Item>
        <Item title={props.operation === 'buy' ? 'Amount Obtained' : 'Amount Sent'}>
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
        <Item kind="total" title={props.operation === 'buy' ? 'Total Sent' : 'Total Obtained'}>
          <FormatEth value={props.effectiveVolumeEth} /> ETH
        </Item>
      </ItemList>
    </div>
  </div>
);

export { TradeSuccessScreen as Screen };
