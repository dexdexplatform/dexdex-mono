import { Address, Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import * as React from 'react';
import { RenderMapper } from '.';
import { expectedVolumeEth, networkCost, expectedVolume } from '../../model/widget-state/selectors';
import { TokenInfo } from '../TokenInfo';
import { SellSteps, BuySteps } from '../TradeSteps';
import { BN } from 'bn.js';

export interface TradeProgressScreen {
  operation: Operation;
  tradeable: Tradeable;
  expectedVolume: BN;
  fromAddress: Address;
  expectedVolumeEth: BN | null;
  networkCost: BN | null;
  txHash?: string | null;
  approvalHash?: string | null;
}

export const mapper: RenderMapper<TradeProgressScreen> = store => ws => ({
  tradeable: ws.tradeable,
  fromAddress: ws.walletDetails!.address!,
  expectedVolume: expectedVolume(ws),
  operation: ws.operation,
  expectedVolumeEth: expectedVolumeEth(ws),
  networkCost: networkCost(ws),
  txHash: ws.tradeExecution.tradeTxHash,
  approvalHash: ws.tradeExecution.approvalTxHash,
});

const TradeProgressScreen: React.SFC<TradeProgressScreen> = props => (
  <div className="widget-status">
    {props.txHash ? (
      <h1 className="step-title">Waiting tx mining</h1>
    ) : (
      <h1 className="step-title">Please approve the trade</h1>
    )}
    <TokenInfo token={props.tradeable} volume={props.expectedVolume} />

    {props.operation === 'sell' ? (
      <SellSteps approvalHash={props.approvalHash} approvalMined={true} tradeHash={props.txHash} />
    ) : (
      <BuySteps tradeHash={props.txHash} />
    )}
  </div>
);

export { TradeProgressScreen as Screen };
