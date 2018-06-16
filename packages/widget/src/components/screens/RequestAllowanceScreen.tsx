import * as React from 'react';
import { RequestAllowanceProps } from '../../model/widget-state/selectors';
import { SellSteps } from '../TradeSteps';
import { TokenInfo } from '../TokenInfo';

const RequestAllowanceScreen: React.SFC<RequestAllowanceProps> = props => (
  <div className="widget-status">
    {props.txHash ? (
      <h1 className="step-title">Waiting tx mining</h1>
    ) : (
      <h1 className="step-title">Approve us to trade on your behalf</h1>
    )}
    <TokenInfo token={props.token} volume={props.volume} />
    <SellSteps approvalHash={props.txHash} />
  </div>
);

export { RequestAllowanceScreen as Screen };
