import { Address, Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import * as React from 'react';
import { RenderMapper } from '.';
import { expectedVolumeEth, networkFee } from '../../model/widget-state/selectors';
import { TokenInfo } from '../TokenInfo';
import { SellSteps, BuySteps } from '../TradeSteps';

export interface TradeProgressScreen {
  operation: Operation;
  tradeable: Tradeable;
  amount: string;
  fromAddress: Address;
  expectedVolumeEth: string;
  networkFee: { ether: string; usd: string };
  txHash?: string | null;
  approvalHash?: string | null;
}

export const mapper: RenderMapper<TradeProgressScreen> = store => ws => ({
  tradeable: ws.tradeable,
  fromAddress: ws.walletDetails!.address!,
  amount: ws.amount,
  operation: ws.operation,
  expectedVolumeEth: expectedVolumeEth(ws),
  networkFee: networkFee(ws),
  txHash: ws.tradeTxHash,
  approvalHash: ws.approvalTxHash,
});

const TradeProgressScreen: React.SFC<TradeProgressScreen> = props => (
  <div className="widget-status">
    {props.txHash ? (
      <h1 className="waiting">Waiting tx mining</h1>
    ) : (
      <h1 className="waiting">Please approve the trade</h1>
    )}
    <TokenInfo token={props.tradeable} volume={props.amount} />

    {props.operation === 'sell' ? (
      <SellSteps approvalHash={props.approvalHash} approvalMined={true} tradeHash={props.txHash} />
    ) : (
      <BuySteps tradeHash={props.txHash} />
    )}
  </div>
);

export { TradeProgressScreen as Screen };
