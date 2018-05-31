import { WidgetState } from '.';
import { getFinalVolumeEth } from '@dexdex/model/lib/trade';
import { fromWei, toTokenDecimals } from '@dexdex/utils/lib/units';
import { computeGasPrice } from '../widget';

export const getTradeVolumeEthWithFee = (ws: WidgetState) => {
  return ws.currentTrade
    ? Number(fromWei(getFinalVolumeEth(ws.currentTrade, ws.config.feePercentage), 'ether')).toFixed(
        4
      )
    : '--';
};

export const networkFee = (ws: WidgetState) => {
  const transactionInfo = ws.currentTrade;
  const gasPrice = computeGasPrice(ws.config.gasprices, ws.gasPrice);
  const gasCost = transactionInfo
    ? String(Number(fromWei(transactionInfo.requiredGas.mul(gasPrice), 'ether')).toFixed(4))
    : '--';

  return {
    ether: gasCost,
    usd: transactionInfo ? String((Number(gasCost) * ws.config.ethers2usdER).toFixed(2)) : '--',
  };
};

export const amountTD = (ws: WidgetState) => toTokenDecimals(ws.amount, ws.tradeable.decimals);

export const getAllowanceTxHash = (ws: WidgetState) => ws.approvalTxHash;

export interface RequestAllowanceProps {
  tokenSymbol: string;
  volume: string;
  txHash?: string | null;
}
export const getTokenAllowanceInfo = (state: WidgetState): RequestAllowanceProps => ({
  tokenSymbol: state.tradeable.symbol,
  volume: state.amount,
  txHash: getAllowanceTxHash(state),
});
