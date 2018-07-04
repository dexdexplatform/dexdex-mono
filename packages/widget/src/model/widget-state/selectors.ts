import { getRequiredGas } from '@dexdex/model/lib/order';
import { getSide } from '@dexdex/model/lib/orderbook';
import { Trade } from '@dexdex/model/lib/trade';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { toTokenDecimals } from '@dexdex/utils/lib/units';
import { BN } from 'bn.js';
import { WidgetState } from '.';
import { isMobile } from '../../config';
import { AmountError, ErrorCode, ErrorMessage } from '../form-error';
import { AccountState, DesktopWallets, WalletState } from '../wallets/index';
import { computeGasPrice } from '../widget';
import { getFinalVolumeEth } from '@dexdex/model/lib/order-selection';

const withTrade = <A>(f: (t: Trade, ws: WidgetState) => A, defaultValue: A) => (
  ws: WidgetState
): A =>
  ws.tradeExecution && ws.tradeExecution.trade ? f(ws.tradeExecution.trade, ws) : defaultValue;

export const expectedVolume = (ws: WidgetState) =>
  toTokenDecimals(ws.amount, ws.tradeable.decimals);

export const expectedVolumeEth = (ws: WidgetState) => {
  return ws.orderSelection
    ? getFinalVolumeEth(ws.orderSelection, expectedVolume(ws), ws.config.feePercentage)
    : null;
};

export const effectiveVolumeEth = withTrade(t => t.volumeEthEffective!, new BN(0));

export const effectiveVolume = withTrade(t => t.volumeEffective!, new BN(0));

export const effectiveNetworkCost = (ws: WidgetState) => {
  const trade = ws.tradeExecution.trade;
  if (trade && trade.gasUsed) {
    return trade.gasUsed.mul(trade.gasPrice);
  } else {
    throw new Error('BUG: cant get eff network cost on this stage');
  }
};
export const networkCost = (ws: WidgetState) => {
  const gasPrice = computeGasPrice(ws.config.gasprices, ws.gasPrice);
  return ws.orderSelection ? getRequiredGas(ws.orderSelection.orders).mul(gasPrice) : null;
};

export const amountTD = (ws: WidgetState): BN => toTokenDecimals(ws.amount, ws.tradeable.decimals);

export const getAllowanceTxHash = (ws: WidgetState) =>
  ws.tradeExecution ? ws.tradeExecution.approvalTxHash : null;

export interface RequestAllowanceProps {
  token: Tradeable;
  volume: BN;
  txHash?: string | null;
}
export const getTokenAllowanceInfo = (state: WidgetState): RequestAllowanceProps => ({
  token: state.tradeable,
  volume: expectedVolume(state),
  txHash: getAllowanceTxHash(state),
});

export const getAmountError = (ws: WidgetState): null | ErrorMessage => {
  const toMessage: Record<AmountError, () => ErrorMessage> = {
    [ErrorCode.VolumeTooBig]: () => {
      const maxVolume = getSide(ws.orderbook!, ws.operation).maxVolume;
      return { code: ErrorCode.VolumeTooBig, token: ws.tradeable, maxVolume };
    },
    [ErrorCode.VolumeTooSmall]: () => {
      const minVolume = getSide(ws.orderbook!, ws.operation).minVolume;
      return { code: ErrorCode.VolumeTooSmall, token: ws.tradeable, minVolume };
    },
    [ErrorCode.VolumeBadFormat]: () => ({ code: ErrorCode.VolumeBadFormat }),
    [ErrorCode.NoOrders]: () => ({ code: ErrorCode.NoOrders }),
  };

  if (ws.errors.amount) {
    return toMessage[ws.errors.amount]();
  } else {
    return null;
  }
};
export const getBalanceError = (ws: WidgetState): null | ErrorMessage => {
  if (ws.errors.balance == null) {
    return null;
  } else {
    return { code: ws.errors.balance };
  }
};

export const getCurrentWalletState = (ws: WidgetState): WalletState | null =>
  ws.selectedWallet == null ? null : ws.wallets[ws.selectedWallet.wallet] || null;

export const getCurrentAccountState = (ws: WidgetState): AccountState | null => {
  if (ws.selectedWallet == null) {
    return null;
  }
  const walletState = ws.wallets[ws.selectedWallet.wallet];
  if (walletState == null || walletState.status === 'error') {
    return null;
  }
  const accountState = walletState.accounts[ws.selectedWallet.accountIdx];
  return accountState;
};

function values<K>(obj: Record<any, K>): K[] {
  return Object.keys(obj).map(key => obj[key]);
}

export const getWalletList = (ws: WidgetState): WalletState[] => {
  if (isMobile) {
    return values(ws.wallets) as WalletState[];
  } else {
    return DesktopWallets.map(id => ws.wallets[id]).filter(
      wallet => wallet != null
    ) as WalletState[];
  }
};
