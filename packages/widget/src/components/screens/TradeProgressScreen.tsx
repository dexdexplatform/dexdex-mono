import { Address, Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import * as React from 'react';
import { RenderMapper } from '.';
import { getTradeVolumeEthWithFee, networkFee } from '../../model/widget-state/selectors';
import './../Widget.css';

export interface TradeProgressScreen {
  operation: Operation;
  tradeable: Tradeable;
  amount: string;
  fromAddress: Address;
  volumeEthWithFee: string;
  networkFee: { ether: string; usd: string };
  txHash?: string | null;
}

export const mapper: RenderMapper<TradeProgressScreen> = store => ws => ({
  tradeable: ws.tradeable,
  fromAddress: ws.walletDetails!.address!,
  amount: ws.amount,
  operation: ws.operation,
  volumeEthWithFee: getTradeVolumeEthWithFee(ws),
  networkFee: networkFee(ws),
  txHash: ws.tradeTxHash,
});

const TradeProgressScreen: React.SFC<TradeProgressScreen> = props => (
  <div className="widget-status">
    {props.txHash ? (
      <h1 className="waiting">Waiting tx mining</h1>
    ) : (
      <h1 className="waiting">Please approve the trade</h1>
    )}
    {/* token info start */}
    <div className="token-info">
      <img className="token-icon" src="golem.png" alt="DAI Token Icon" />
      <p className="token-amount">{props.amount}</p>
      <p className="token-name">{props.tradeable.name}</p>
    </div>
    {/* token info ends */}

    {/* status steps */}
    <ul className="status-steps">
      <li className="step completed">
        <p>Completed Step</p>
      </li>
      <li className="step completed">
        <p>Completed Step</p>
        <ul className="sub-step completed">
          <li className="sub-step-message">
            <p>Completed Step</p>
          </li>
        </ul>
      </li>
      <li className="step current">
        <p>Current Step</p>
      </li>
      <li className="step pending">
        <p>Pending Step</p>
        <ul className="sub-step pending">
          <li className="sub-step-message">
            <p>Completed Step</p>
          </li>
        </ul>
      </li>
    </ul>
    {/* end status steps */}

    {/* <dl>
      <dt className="label">Operation</dt>
      <dd className="value">{props.operation}</dd>
      <hr />
      <dt className="label">Wallet Account Address</dt>
      <dd className="value">{props.fromAddress}</dd>
      <hr />
      <dt className="label">Token</dt>
      <dd className="value">{props.tradeable.symbol}</dd>
      <hr />
      <dt className="label">Token Amount</dt>
      <dd className="value">{props.amount}</dd>
      <hr />
      <dt className="label">ETH Amount</dt>
      <dd className="value">{props.volumeEthWithFee}</dd>
      <hr />
      <dt className="label">Network Fee</dt>
      <dd className="value">
        {props.networkFee.ether} ETH / {props.networkFee.usd} USD
      </dd>
    </dl>
    {props.txHash && (
      <React.Fragment>
        <p className="label">Transaction Hash</p>
        {props.txHash}
      </React.Fragment>
    )}
    <hr /> */}
  </div>
);

export { TradeProgressScreen as Screen };
