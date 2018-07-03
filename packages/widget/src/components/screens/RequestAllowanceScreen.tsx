import * as React from 'react';
import { RequestAllowanceProps } from '../../model/widget-state/selectors';
import { SellSteps } from '../TradeSteps';
import { TokenInfo } from '../TokenInfo';
import { ScreenHeader, ScreenContent, Screen } from '../Screen';

const RequestAllowanceScreen: React.SFC<RequestAllowanceProps> = props => (
  <Screen kind="info" title={props.txHash ? 'Working...' : 'Approve us to trade on your behalf'}>
    <ScreenHeader>
      <TokenInfo token={props.token} volume={props.volume} />
    </ScreenHeader>
    <ScreenContent>
      <SellSteps approvalHash={props.txHash} />
    </ScreenContent>
  </Screen>
);

export { RequestAllowanceScreen as Screen };
