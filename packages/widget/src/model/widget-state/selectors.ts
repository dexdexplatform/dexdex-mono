import { getFinalVolumeEth } from '@dexdex/model/lib/trade-plan';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { fromWei, getDecimalBase, toTokenDecimals } from '@dexdex/utils/lib/units';
import { BN } from 'bn.js';
import { WidgetState } from '.';
import { computeGasPrice } from '../widget';
import { Trade, TradeState } from '@dexdex/model/lib/trade';

const formatEth = (volumeEth: null | BN): string =>
  volumeEth ? Number(fromWei(volumeEth, 'ether')).toFixed(4) : '--';

const withTrade = <A>(f: (t: Trade, ws: WidgetState) => A, defaultValue: A) => (
  ws: WidgetState
): A =>
  ws.tradeExecution && ws.tradeExecution.trade ? f(ws.tradeExecution.trade, ws) : defaultValue;

export const expectedVolumeEth = (ws: WidgetState) => {
  return ws.tradePlan ? formatEth(getFinalVolumeEth(ws.tradePlan, ws.config.feePercentage)) : '--';
};

export const effectiveVolumeEth = withTrade(t => formatEth(t.volumeEthEffective), '--');

export const effectiveVolume = withTrade(t => formatEth(t.volumeEffective), '--');
export const effectivePrice = withTrade((t, ws) => {
  if (
    t.state === TradeState.Completed &&
    t.volumeEffective != null &&
    t.volumeEthEffective != null
  ) {
    return formatEth(
      t.volumeEffective // value without decimals
        .div(getDecimalBase(ws.tradeable.decimals)) // div by base => to decimals
        .div(t.volumeEthEffective) // get price
    );
  }
  return '--';
}, '--');

export const networkFee = (ws: WidgetState) => {
  const transactionInfo = ws.tradePlan;
  const gasPrice = computeGasPrice(ws.config.gasprices, ws.gasPrice);
  const gasCost = transactionInfo ? formatEth(transactionInfo.requiredGas.mul(gasPrice)) : '--';

  return {
    ether: gasCost,
    usd: transactionInfo ? (Number(gasCost) * ws.config.ethers2usdER).toFixed(2) : '--',
  };
};

export const amountTD = (ws: WidgetState): BN => toTokenDecimals(ws.amount, ws.tradeable.decimals);

export const getAllowanceTxHash = (ws: WidgetState) =>
  ws.tradeExecution ? ws.tradeExecution.approvalTxHash : null;

export interface RequestAllowanceProps {
  token: Tradeable;
  volume: string;
  txHash?: string | null;
}
export const getTokenAllowanceInfo = (state: WidgetState): RequestAllowanceProps => ({
  token: state.tradeable,
  volume: state.amount,
  txHash: getAllowanceTxHash(state),
});
