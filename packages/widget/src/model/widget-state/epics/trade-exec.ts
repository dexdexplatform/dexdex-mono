import Erc20 from '@dexdex/erc20';
import { getOrdersData } from '@dexdex/model/lib/order';
import { getFinalVolumeEth } from '@dexdex/model/lib/order-selection';
import { Trade, TradeState } from '@dexdex/model/lib/trade';
import BN from 'bn.js';
import Eth, { Address, TransactionReceipt } from 'ethjs-query';
import { Observable, Observer } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { WidgetState } from '..';
import { appConfig } from '../../../config';
import DexDex from '../../contracts/dexdex';
import { ServerApi } from '../../server-api';
import { WalletId } from '../../wallets/base';
import { isLedgerConnected } from '../../wallets/ledger';
import { computeGasPrice, TransactionState, TxStage } from '../../widget';
import { Actions, setTransactionState } from '../actions';
import { expectedVolume } from '../selectors';
import { Epic } from '../store';
import { filterAction } from './utils';
import { Operation } from '@dexdex/model/lib/base';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isRejectionError(err: any) {
  return (
    err.message &&
    (err.message.includes('MetaMask Tx Signature: User denied transaction signature.') ||
      err.message.includes('Ledger device: Condition of use not satisfied'))
  );
}

async function dexdexBuy(opts: {
  eth: Eth;
  account: Address;
  token: Address;
  volume: BN;
  volumeEth: BN;
  ordersData: string;
  affiliate: Address;
  gasPrice: BN;
}): Promise<string> {
  const dexdex = DexDex(opts.eth, appConfig().ContractAddress);
  const estimatedGas = await dexdex.estimateGasForBuy(
    opts.eth,
    opts.token,
    opts.volume,
    opts.ordersData,
    opts.account,
    opts.affiliate,
    {
      from: opts.account,
      value: opts.volumeEth,
      gasPrice: opts.gasPrice,
    }
  );

  return await dexdex.buy(opts.token, opts.volume, opts.ordersData, opts.account, opts.affiliate, {
    from: opts.account,
    value: opts.volumeEth,
    gas: estimatedGas.muln(1.5),
    gasPrice: opts.gasPrice,
  });
}

async function dexdexSell(opts: {
  eth: Eth;
  account: Address;
  token: Address;
  volume: BN;
  volumeEth: BN;
  ordersData: string;
  affiliate: Address;
  gasPrice: BN;
}): Promise<string> {
  const dexdex = DexDex(opts.eth, appConfig().ContractAddress);
  const estimatedGas = await dexdex.estimateGasForSell(
    opts.eth,
    opts.token,
    opts.volume,
    opts.volumeEth,
    opts.ordersData,
    opts.account,
    opts.affiliate,
    {
      from: opts.account,
      gasPrice: opts.gasPrice,
    }
  );
  return await dexdex.sell(
    opts.token,
    opts.volume,
    opts.volumeEth,
    opts.ordersData,
    opts.account,
    opts.affiliate,
    {
      from: opts.account,
      gas: estimatedGas.muln(1.5),
      gasPrice: opts.gasPrice,
    }
  );
}

async function waitForTransaction(eth: Eth, txId: string): Promise<TransactionReceipt> {
  let txReceipt;
  while (!txReceipt) {
    try {
      txReceipt = await eth.getTransactionReceipt(txId);
    } catch (err) {
      console.log('errror', err);
    }
  }

  return txReceipt;
}

async function needsTokenAllowance({
  eth,
  account,
  token,
  volume,
}: TradeDetails): Promise<boolean> {
  const ourAddress = appConfig().ContractAddress;
  const erc20 = Erc20(eth, token);

  const currentAllowance = await erc20.allowance(account, ourAddress);
  return currentAllowance.lt(volume);
}

async function approveTokenAllowance({
  eth,
  account,
  token,
  gasPrice,
}: TradeDetails): Promise<string> {
  const ourAddress = appConfig().ContractAddress;
  const erc20 = Erc20(eth, token);
  // MaxVolume = 2^256 -1
  const MaxVolume = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16);
  return erc20.approve(ourAddress, MaxVolume, { from: account, gasPrice });
}

type TradeDetails = {
  walletId: WalletId;
  eth: Eth;
  account: string;
  affiliate: string;
  gasPrice: BN;
  ordersData: string;
  volume: BN;
  volumeEth: BN;
  token: string;
  operation: Operation;
};

function getTradeDetails(state: WidgetState): TradeDetails {
  const volume = expectedVolume(state);
  return {
    walletId: state.wallet!.id,
    eth: state.wallet!.eth,
    account: state.wallet!.address,
    affiliate: state.config.affiliateAddress,
    gasPrice: computeGasPrice(state.config.gasprices, state.gasPrice),
    ordersData: getOrdersData(state.orderSelection!.orders),
    volume,
    volumeEth: getFinalVolumeEth(state.orderSelection!, volume, state.config.feePercentage),
    token: state.token.address,
    operation: state.operation,
  };
}

async function waitForTrade(api: ServerApi, tradeTxId: string): Promise<Trade> {
  let trade: Trade | null = null;
  while (trade == null || trade.state === TradeState.Pending) {
    trade = await api.getTrade(tradeTxId);
    await wait(1000);
  }
  return trade;
}

async function executeTrade(
  api: ServerApi,
  state: WidgetState,
  reportState: (newState: TransactionState) => void
) {
  const tradeDetails = getTradeDetails(state);
  const isSell = tradeDetails.operation === 'sell';
  const isLedger = tradeDetails.walletId === WalletId.Ledger;
  const { eth } = tradeDetails;

  try {
    if (isSell && (await needsTokenAllowance(tradeDetails))) {
      reportState({ stage: TxStage.RequestTokenAllowanceSignature });

      if (isLedger && !(await isLedgerConnected())) {
        reportState({ stage: TxStage.LedgerNotConnected });
        return;
      }

      const allowanceTxId = await approveTokenAllowance(tradeDetails);
      reportState({ stage: TxStage.TokenAllowanceInProgress, txId: allowanceTxId });
      await waitForTransaction(eth, allowanceTxId);
    }

    reportState({ stage: TxStage.RequestTradeSignature });
    if (isLedger && !(await isLedgerConnected())) {
      reportState({ stage: TxStage.LedgerNotConnected });
      return;
    }

    const tradeTxId = await (isSell ? dexdexSell(tradeDetails) : dexdexBuy(tradeDetails));
    reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
    await waitForTransaction(eth, tradeTxId);
    const trade = await waitForTrade(api, tradeTxId);

    if (trade.state === TradeState.Failed) {
      reportState({ stage: TxStage.TradeFailed, trade });
    } else {
      reportState({ stage: TxStage.TradeCompleted, trade });
    }
  } catch (err) {
    if (isRejectionError(err)) {
      reportState({ stage: TxStage.SignatureRejected });
    } else {
      console.error(err);
      reportState({ stage: TxStage.UnkownError });
    }
  }
}

function runTrade(api: ServerApi, state: WidgetState): Observable<TransactionState> {
  return Observable.create((observer: Observer<TransactionState>) => {
    const reportState = (newState: TransactionState) => observer.next(newState);
    const p = executeTrade(api, state, reportState);
    p.catch(err => observer.error(err));
    p.then(() => observer.complete());

    return () => {
      console.log("can't unsubscribe to this observable");
    };
  });
}

export const executeTradeEpic = (api: ServerApi): Epic<WidgetState, Actions> => changes =>
  changes.pipe(
    filterAction('startTransaction'),
    filter(({ state }) => {
      const wallet = state.wallet;

      if (wallet == null || wallet.networkId !== appConfig().networkId) {
        // something is wrong here
        console.log('invalid UI state: starting tx with no valid wallet');
        return false;
      }

      if (state.orderSelection == null) {
        // something is wrong here
        console.log('invalid UI state: starting tx with no trade plan');
        return false;
      }
      return true;
    }),
    switchMap(change => runTrade(api, change.state)),
    map(setTransactionState)
  );
