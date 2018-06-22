import { Address, Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
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

export interface TradeProgressScreen {
  operation: Operation;
  tradeable: Tradeable;
  expectedVolume: BN;
  fromAddress: Address;
  expectedVolumeEth: BN;
  networkCost: BN | null;
  txHash?: string | null;
  approvalHash?: string | null;
}

export const mapper: RenderMapper<TradeProgressScreen> = store => ws => ({
  tradeable: ws.tradeable,
  fromAddress: getCurrentAccountState(ws)!.address,
  expectedVolume: expectedVolume(ws),
  operation: ws.operation,
  expectedVolumeEth: expectedVolumeEth(ws)!,
  networkCost: networkCost(ws),
  txHash: ws.tradeExecution.tradeTxHash,
  approvalHash: ws.tradeExecution.approvalTxHash,
});

const TradeProgressScreen: React.SFC<TradeProgressScreen> = props => (
  <div className="info-screen">
    <h1 className="info-screen-title">
      {props.txHash ? 'Waiting tx mining' : 'Please approve the trade'}
    </h1>
    <div className="info-screen-header">
      <TradeInfo
        token={props.tradeable}
        volume={props.expectedVolume}
        volumeEth={props.expectedVolumeEth}
      />
    </div>
    <div className="info-screen-content">
      {props.operation === 'sell' ? (
        <SellSteps
          approvalHash={props.approvalHash}
          approvalMined={true}
          tradeHash={props.txHash}
        />
      ) : (
        <BuySteps tradeHash={props.txHash} />
      )}
    </div>
  </div>
);

export { TradeProgressScreen as Screen };
