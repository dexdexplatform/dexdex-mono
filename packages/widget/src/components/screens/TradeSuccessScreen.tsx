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
    <h1 className="step-title">Total Sent/Obtained</h1>
    {/* token info start */}
    <div className="token-info">
      <img className="token-icon" src={tokenBigImg(props.tradeable.symbol)} alt="Token Icon" />
      <p className="token-amount">
        <FormatToken value={props.effectiveVolume} token={props.tradeable} />
      </p>
      <p className="token-name">
        {props.tradeable.name} ({props.tradeable.symbol})
      </p>
      {/* wallet info - only success*/}
      <div className="wallet-info-success">
        <img className="wallet-icon" src={props.wallet.icon} alt="Wallet Icon" />
        <FormatAddress className="wallet-address" value={props.fromAddress} />
      </div>
      {/* end wallet info - only success*/}
    </div>
    {/* end token info */}

    <ul className="transacion-details-list">
      <li className="title">
        <div className="label">Transaction details</div>
        <div className="value">May-21-2018 07:36:55 AM +UTC</div>
      </li>
      <li>
        <div className="label">Operation</div>
        <div className="value">{props.operation}</div>
      </li>
      <li>
        <div className="label">Transaction</div>
        <div className="value">
          <FormatTxHash className="link" value={props.tradeTxHash} />
        </div>
      </li>
      <li>
        <div className="label">Amount bought</div>
        <div className="value">
          <FormatToken value={props.effectiveVolume} token={props.tradeable} />
        </div>
      </li>
      <li>
        <div className="label">{props.tradeable.name} Price</div>
        <div className="value">
          <FormatPrice
            volume={props.effectiveVolume}
            volumeEth={props.effectiveVolumeEth}
            token={props.tradeable}
          />
        </div>
      </li>
      <li>
        <div className="label">Network Cost</div>
        <div className="value">
          <FormatEth value={props.networkCost} /> ETH
        </div>
      </li>
      {/* <li>
        <div className="label">Dexdex Fee</div>
        <div className="value">Fee dexdex</div>
      </li>
      <li>
        <div className="label">Price Optimization</div>
        <div className="value">Price Optimization %</div>
      </li> */}
      <li className="total">
        <div className="label">Total</div>
        <div className="value">
          <FormatEth value={props.effectiveVolumeEth} /> ETH
        </div>
      </li>
    </ul>
  </div>
);

export { TradeSuccessScreen as Screen };
