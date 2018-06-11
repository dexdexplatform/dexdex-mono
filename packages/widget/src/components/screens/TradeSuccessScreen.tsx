import { Address, Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import * as React from 'react';
import { RenderMapper } from '.';
import {
  effectivePrice,
  effectiveVolume,
  effectiveVolumeEth,
  networkFee,
} from '../../model/widget-state/selectors';

export interface TradeSuccessScreenProps {
  operation: Operation;
  tradeable: Tradeable;
  amount: string;
  fromAddress: Address;
  effectiveVolume: string;
  effectiveVolumeEth: string;
  effectivePrice: string;
  networkFee: { ether: string; usd: string };
  tradeTxHash: string;
}

export const mapper: RenderMapper<TradeSuccessScreenProps> = store => ws => {
  if (ws.tradeTxHash == null) {
    throw new Error('BUG: no tradetxhash on success screen');
  }
  if (ws.walletDetails == null || ws.walletDetails.address == null) {
    throw new Error('BUG: no wallet address on success screen');
  }
  return {
    tradeable: ws.tradeable,
    fromAddress: ws.walletDetails.address,
    amount: ws.amount,
    operation: ws.operation,
    effectiveVolume: effectiveVolume(ws),
    effectiveVolumeEth: effectiveVolumeEth(ws),
    effectivePrice: effectivePrice(ws),
    networkFee: networkFee(ws),
    tradeTxHash: ws.tradeTxHash,
  };
};

const TradeSuccessScreen: React.SFC<TradeSuccessScreenProps> = props => (
  <div className="widget-status">
    {/* token info start */}
    <div className="token-info">
      <img className="token-icon" src="golem.png" alt="DAI Token Icon" />
      <p className="token-amount">{props.effectiveVolume}</p>
      <p className="token-name">{props.tradeable.name}</p>
      {/* wallet info - only success*/}
      <div className="wallet-info-success">
        <img className="wallet-icon" src="metamask.png" alt="Wallet Icon" />
        <a className="wallet-address" href="#">
          {props.fromAddress}
        </a>
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
          <a className="link" href={`https://etherscan.io/tx/${props.tradeTxHash}`}>
            {props.tradeTxHash}
          </a>
        </div>
      </li>
      <li>
        <div className="label">Amount bought</div>
        <div className="value">{props.effectiveVolume}</div>
      </li>
      <li>
        <div className="label">{props.tradeable.name} Price</div>
        <div className="value">{props.effectivePrice}</div>
      </li>
      <li>
        <div className="label">Network Cost</div>
        <div className="value">{props.networkFee.ether} ETH</div>
      </li>
      {/* <li>
        <div className="label">Dexdex Fee</div>
        <div className="value">Fee dexdex</div>
      </li>
      <li>
        <div className="label">Price Optimization</div>
        <div className="value">Price Optimization %</div>
      </li> */}
      {/* <li className="total">
        <div className="label">Total</div>
        <div className="value">{props.effectiveVolumeEth} ETH</div>
      </li> */}
    </ul>
  </div>
);

export { TradeSuccessScreen as Screen };
