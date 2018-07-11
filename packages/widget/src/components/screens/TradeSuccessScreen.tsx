import { Address, Operation } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import { feeFromVolumeEthWithFee } from '@dexdex/model/lib/fee';
import BN from 'bn.js';
import * as React from 'react';
import { RenderMapper } from '.';
import { WalletInfo } from '../../model/wallets/index';
import { goBack } from '../../model/widget-state/actions';
import {
  effectiveNetworkCost,
  effectiveVolume,
  effectiveVolumeEth,
  getCurrentAccountState,
} from '../../model/widget-state/selectors';
import { FormatAddress, FormatEth, FormatPrice, FormatToken, FormatTxHash } from '../Format';
import { TradeInfo } from '../TokenInfo';
import { Screen, ScreenHeader, ScreenContent } from '../Screen';

const classes = require('./TradeSuccessScreen.css');

const ItemList: React.SFC = ({ children }) => <ul className={classes.itemList}>{children}</ul>;

const Item: React.SFC<{ kind?: 'title' | 'total'; title: string }> = ({
  kind,
  title,
  children,
}) => (
  <li className={kind ? classes.itemTitle : ''}>
    <div>{title}</div>
    <div>{children}</div>
  </li>
);

export interface TradeSuccessScreenProps {
  operation: Operation;
  token: Token;
  amount: string;
  fromAddress: Address;
  volume: BN;
  volumeEth: BN;
  effectiveVolume: BN;
  effectiveVolumeEth: BN;
  serviceFee: BN;
  executionDate: Date;
  networkCost: BN | null;
  tradeTxHash: string;
  wallet: WalletInfo;
  goBack: () => void;
}

export const mapper: RenderMapper<TradeSuccessScreenProps> = store => ws => {
  const accountState = getCurrentAccountState(ws);
  if (ws.tradeExecution.trade == null) {
    throw new Error('BUG: no trade on success screen');
  }
  if (ws.tradeExecution.tradeTxHash == null) {
    throw new Error('BUG: no tradetxhash on success screen');
  }
  if (accountState == null) {
    throw new Error('BUG: no wallet address on success screen');
  }
  if (ws.selectedWallet == null) {
    throw new Error('BUG: no selected wallet on success screen');
  }
  const effVolumeEth = effectiveVolumeEth(ws);

  return {
    token: ws.token,
    fromAddress: accountState.address,
    amount: ws.amount,
    operation: ws.operation,
    volumeEth: ws.tradeExecution.trade.volumeEth,
    volume: ws.tradeExecution.trade.volume,
    effectiveVolume: effectiveVolume(ws),
    effectiveVolumeEth: effVolumeEth,
    serviceFee: feeFromVolumeEthWithFee(ws.operation, effVolumeEth, ws.config.feePercentage),
    networkCost: effectiveNetworkCost(ws),
    executionDate: ws.tradeExecution.trade.executionDate!,
    tradeTxHash: ws.tradeExecution.tradeTxHash,
    wallet: WalletInfo[ws.selectedWallet.wallet],
    goBack: () => store.dispatch(goBack()),
  };
};

const TradeSuccessScreen: React.SFC<TradeSuccessScreenProps> = props => (
  <Screen
    kind="info"
    title={props.operation === 'buy' ? 'Transaction Succesful' : 'Transaction Succesful'}
  >
    <ScreenHeader>
      <TradeInfo
        token={props.token}
        volume={props.effectiveVolume}
        volumeEth={props.effectiveVolumeEth}
        operation={props.operation}
      />
    </ScreenHeader>
    <ScreenContent>
      <ItemList>
        <Item kind="title" title={`Transaction details`}>
          <div className={classes.timestamp}>{props.executionDate.toISOString()}</div>
        </Item>
        <Item title="Account">
          <FormatAddress className={classes.addressOverride} value={props.fromAddress} />
        </Item>
        <Item title="Transaction">
          <FormatTxHash className={classes.txhashOverride} value={props.tradeTxHash} />
        </Item>
        <Item title="Amount Refunded">
          {props.operation === 'buy' ? (
            <>
              <FormatEth value={props.volumeEth.sub(props.effectiveVolumeEth)} /> ETH
            </>
          ) : (
            <>
              <FormatToken value={props.volume.sub(props.effectiveVolume)} token={props.token} />{' '}
              {props.token.symbol}
            </>
          )}
        </Item>
        <Item title={`${props.token.symbol} Price`}>
          <FormatPrice
            volume={props.effectiveVolume}
            volumeEth={props.effectiveVolumeEth}
            token={props.token}
          />{' '}
          ETH
        </Item>
        <Item title="Network Cost">
          <FormatEth value={props.networkCost} /> ETH
        </Item>
        <Item title="Service Fee">
          <FormatEth value={props.serviceFee} /> ETH
        </Item>
        {/* <Item title="Price Optimization">
          <FormatPriceComparison
            effectiveVolume={props.effectiveVolume}
            effectiveVolumeEth={props.effectiveVolumeEth}
            volume={props.volume}
            volumeEth={props.volumeEth}
            token={props.token}
          />
        </Item> */}
      </ItemList>
    </ScreenContent>
    <button className={classes.btnClose} onClick={props.goBack}>
      ✕
    </button>
  </Screen>
);

export { TradeSuccessScreen as Screen };
