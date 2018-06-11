import { getFinalVolumeEth } from '@dexdex/model/lib/trade-plan';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { fromWei, getDecimalBase, toTokenDecimals } from '@dexdex/utils/lib/units';
import { BN } from 'bn.js';
import { WidgetState } from '.';
import { computeGasPrice } from '../widget';

const formatEth = (volumeEth: null | BN): string =>
  volumeEth ? Number(fromWei(volumeEth, 'ether')).toFixed(4) : '--';

export const expectedVolumeEth = (ws: WidgetState) => {
  return ws.tradePlan ? formatEth(getFinalVolumeEth(ws.tradePlan, ws.config.feePercentage)) : '--';
};

export const effectiveVolumeEth = (ws: WidgetState) => {
  return ws.trade ? formatEth(ws.trade.volumeEthEffective) : '--';
};

export const effectiveVolume = (ws: WidgetState) => {
  return ws.trade ? formatEth(ws.trade.volumeEffective) : '--';
};

export const effectivePrice = (ws: WidgetState) => {
  if (ws.trade == null || ws.trade.volumeEffective == null || ws.trade.volumeEthEffective == null) {
    return '--';
  }

  return formatEth(
    ws.trade.volumeEffective // value without decimals
      .div(getDecimalBase(ws.tradeable.decimals)) // div by base => to decimals
      .div(ws.trade.volumeEthEffective) // get price
  );
};

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

export const getAllowanceTxHash = (ws: WidgetState) => ws.approvalTxHash;

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
