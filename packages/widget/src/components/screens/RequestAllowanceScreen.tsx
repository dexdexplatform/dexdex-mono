import * as React from 'react';
import { RequestAllowanceProps } from '../../model/widget-state/selectors';
import { SellSteps } from '../TradeSteps';
import { TokenInfo } from '../TokenInfo';

const RequestAllowanceScreen: React.SFC<RequestAllowanceProps> = props => (
  <div className="screen">
    <h1 className="info-screen-title">
      {props.txHash ? 'Working...' : 'Approve us to trade on your behalf'}
    </h1>
    <div className="info-screen-header">
      <TokenInfo token={props.token} volume={props.volume} />
    </div>
    <div className="info-screen-content">
      <SellSteps approvalHash={props.txHash} />
    </div>
  </div>
);

export { RequestAllowanceScreen as Screen };
