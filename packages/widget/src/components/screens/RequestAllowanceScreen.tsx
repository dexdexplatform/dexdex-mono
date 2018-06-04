import * as React from 'react';
import { RequestAllowanceProps } from '../../model/widget-state/selectors';
import './../Widget.css';

const RequestAllowanceScreen: React.SFC<RequestAllowanceProps> = props => (
  <div className="widget-status">
    {props.txHash ? (
      <h1 className="waiting">Waiting tx mining</h1>
    ) : (
      <h1 className="waiting">Approve us to trade on your behalf</h1>
    )}
    {/* token info start */}
    <div className="token-info">
      <img className="token-icon" src="golem.png" alt="DAI Token Icon" />
      <p className="token-amount">props.amount</p>
      <p className="token-name">props.tradeable.name</p>
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
      <dt className="label">Token</dt>
      <dd className="value">{props.tokenSymbol}</dd>
      <hr />
      <dt className="label">Volume</dt>
      <dd className="value">{props.volume}</dd>
      <hr />
      {props.txHash && (
        <React.Fragment>
          <dt className="label">Transaction</dt>
          <dd className="value">{props.txHash}</dd>
          <hr />
        </React.Fragment>
      )}
    </dl> */}
  </div>
);

export { RequestAllowanceScreen as Screen };
