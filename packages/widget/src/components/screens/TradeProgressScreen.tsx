import { Address, Operation } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import { BN } from 'bn.js';
import * as React from 'react';
import { RenderMapper } from '.';
import {
  expectedVolume,
  expectedVolumeEth,
  getCurrentAccountState,
  networkCost,
} from '../../model/widget-state/selectors';
import { TradeInfo } from '../TokenInfo';
import { BuySteps, SellSteps } from '../TradeSteps';
import { Screen, ScreenHeader, ScreenContent } from '../Screen';

export interface TradeProgressScreen {
  operation: Operation;
  token: Token;
  expectedVolume: BN;
  fromAddress: Address;
  expectedVolumeEth: BN;
  networkCost: BN | null;
  txHash?: string | null;
  approvalHash?: string | null;
}

export const mapper: RenderMapper<TradeProgressScreen> = store => ws => ({
  token: ws.token,
  fromAddress: getCurrentAccountState(ws)!.address,
  expectedVolume: expectedVolume(ws),
  operation: ws.operation,
  expectedVolumeEth: expectedVolumeEth(ws)!,
  networkCost: networkCost(ws),
  txHash: ws.tradeExecution.tradeTxHash,
  approvalHash: ws.tradeExecution.approvalTxHash,
});

const TradeProgressScreen: React.SFC<TradeProgressScreen> = props => (
  <Screen kind="info" title={props.txHash ? 'Working...' : `Please, approve to ${props.operation}`}>
    <ScreenHeader>
      <TradeInfo
        token={props.token}
        volume={props.expectedVolume}
        volumeEth={props.expectedVolumeEth}
        inProgress
        operation={props.operation}
      />
    </ScreenHeader>
    <ScreenContent>
      {props.operation === 'sell' ? (
        <SellSteps
          approvalHash={props.approvalHash}
          approvalMined={true}
          tradeHash={props.txHash}
        />
      ) : (
        <BuySteps tradeHash={props.txHash} />
      )}
    </ScreenContent>
  </Screen>
);

export { TradeProgressScreen as Screen };
