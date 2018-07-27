import { Token } from '@dexdex/model/lib/token';
import * as React from 'react';
import { RenderMapper } from '.';
import { TxStage } from '../../model/widget';
import { getAllowanceTxHash } from '../../model/widget-state/selectors';
import { Screen, ScreenContent, ScreenHeader } from '../Screen';
import { TokenInfo } from '../TokenInfo';
import { SellSteps } from '../TradeSteps';

export interface RequestAllowanceProps {
  stage: TxStage.RequestTokenAllowanceSignature | TxStage.TokenAllowanceInProgress;
  token: Token;
  txHash?: string | null;
}

export const mapper: RenderMapper<RequestAllowanceProps> = store => ws => {
  if (
    ws.tradeExecution.stage !== TxStage.RequestTokenAllowanceSignature &&
    ws.tradeExecution.stage !== TxStage.TokenAllowanceInProgress
  ) {
    throw new Error(`Can't render TradeScreen in stage: ${ws.tradeExecution.stage}`);
  }
  return {
    stage: ws.tradeExecution.stage,
    token: ws.token,
    txHash: getAllowanceTxHash(ws),
  };
};

const RequestAllowanceScreen: React.SFC<RequestAllowanceProps> = props => (
  <Screen kind="info" title={props.txHash ? 'Working...' : 'Approve us to trade on your behalf'}>
    <ScreenHeader>
      <TokenInfo token={props.token} />
    </ScreenHeader>
    <ScreenContent>
      <SellSteps stage={props.stage} approvalHash={props.txHash} />
    </ScreenContent>
  </Screen>
);

export { RequestAllowanceScreen as Screen };
