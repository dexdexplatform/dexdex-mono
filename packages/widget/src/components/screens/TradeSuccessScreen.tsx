import { Address, Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import * as React from 'react';
import { RenderMapper } from '.';
import { getTradeVolumeEthWithFee, networkFee } from '../../model/widget-state/selectors';
import './../Widget.css';

export interface TradeSuccessScreenProps {
  operation: Operation;
  tradeable: Tradeable;
  amount: string;
  fromAddress: Address;
  volumeEthWithFee: string;
  networkFee: { ether: string; usd: string };
  tradeTxHash: string;
}

export const mapper: RenderMapper<TradeSuccessScreenProps> = store => ws => {
  return {
    tradeable: ws.tradeable,
    fromAddress: ws.walletDetails!.address!,
    amount: ws.amount,
    operation: ws.operation,
    volumeEthWithFee: getTradeVolumeEthWithFee(ws),
    networkFee: networkFee(ws),
    tradeTxHash: ws.tradeTxHash!,
  };
};

const TradeSuccessScreen: React.SFC<TradeSuccessScreenProps> = props => (
  <div className="widget-status">
    <h1 className="success">Finished!!!!!</h1>
    <h2>The trade was an outstanding success!!!</h2>
    <dl>
      <dt className="label">Operation</dt>
      <dd className="value">{props.operation}</dd>
      <hr />
      <dt className="label">Wallet Account Address</dt>
      <dd className="value">{props.fromAddress}</dd>
      <hr />
      <dt className="label">Token</dt>
      <dd className="value">{props.tradeable.name}</dd>
      <hr />
      <dt className="label">Token Amount</dt>
      <dd className="value">{props.amount}</dd>
      <hr />
      <dt className="label">Volume Eth</dt>
      <dd className="value">{props.volumeEthWithFee}</dd>
      <hr />
      <dt className="label">Network Fee</dt>
      <dd className="value">
        {props.networkFee.ether} ETH / {props.networkFee.usd} USD
      </dd>
    </dl>
    <hr />
    <p className="label">Transaction Hash</p>
    <a className="link" href="#">
      {props.tradeTxHash}
    </a>
  </div>
);

export { TradeSuccessScreen as Screen };
