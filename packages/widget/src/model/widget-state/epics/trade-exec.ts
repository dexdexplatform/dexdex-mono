import Erc20 from '@dexdex/erc20';
import { Operation } from '@dexdex/model/lib/base';
import { Trade, TradeState } from '@dexdex/model/lib/trade';
import { Token } from '@dexdex/model/lib/token';
import { BN } from 'bn.js';
import Eth, { Address, TransactionReceipt } from 'ethjs-query';
import { empty, Observable, Observer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WidgetState } from '..';
import { appConfig } from '../../../config';
import DexDex from '../../contracts/dexdex';
import { ServerApi } from '../../server-api';
import { computeGasPrice, TransactionState, TxStage } from '../../widget';
import { Actions, setTransactionState } from '../actions';
import { getCurrentAccountState, getCurrentWalletState, expectedVolume } from '../selectors';
import { Epic } from '../store';
import { filterAction } from './utils';
import { getOrdersData } from '@dexdex/model/lib/order';
import { getFinalVolumeEth } from '@dexdex/model/lib/order-selection';

const NOAFFILIATE = '0x0000000000000000000000000000000000000000';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type TradeParameters = {
  ordersData: string;
  volume: BN;
  volumeEth: BN;
};

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
  try {
    const dexdex = DexDex(opts.eth, appConfig().ContractAddress);
    return await dexdex.buy(
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
  } catch (err) {
    throw err;
    // throw toWalletError(err);
  }
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
  try {
    const dexdex = DexDex(opts.eth, appConfig().ContractAddress);
    return await dexdex.sell(
      opts.token,
      opts.volume,
      opts.volumeEth,
      opts.ordersData,
      opts.account,
      opts.affiliate,
      { from: opts.account, gasPrice: opts.gasPrice }
    );
  } catch (err) {
    throw err;
    // throw toWalletError(err);
  }
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

async function approveTokenAllowance(
  eth: Eth,
  account: Address,
  token: Token,
  volume: BN,
  gasPrice: BN
): Promise<string> {
  const tokenContract = Erc20(eth, token.address);
  return tokenContract.approve(appConfig().ContractAddress, volume, { from: account, gasPrice });
}

async function executeTrade(
  api: ServerApi,
  eth: Eth,
  account: Address,
  gasPrice: BN,
  token: Token,
  operation: Operation,
  tradeParams: TradeParameters,
  reportState: (newState: TransactionState) => void
) {
  let tradeTxId: string;
  try {
    if (operation === 'buy') {
      reportState({ stage: TxStage.RequestTradeSignature });
      tradeTxId = await dexdexBuy({
        eth,
        account,
        token: token.address,
        volume: tradeParams.volume,
        volumeEth: tradeParams.volumeEth,
        ordersData: tradeParams.ordersData,
        gasPrice,
        affiliate: NOAFFILIATE,
      });
    } else {
      reportState({ stage: TxStage.RequestTokenAllowanceSignature });
      const allowanceTxId = await approveTokenAllowance(
        eth,
        account,
        token,
        tradeParams.volume,
        gasPrice
      );
      reportState({ stage: TxStage.TokenAllowanceInProgress, txId: allowanceTxId });
      await waitForTransaction(eth, allowanceTxId);

      reportState({ stage: TxStage.RequestTradeSignature });
      tradeTxId = await dexdexSell({
        eth,
        account,
        token: token.address,
        volume: tradeParams.volume,
        volumeEth: tradeParams.volumeEth,
        ordersData: tradeParams.ordersData,
        gasPrice,
        affiliate: NOAFFILIATE,
      });
    }

    reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
    const tradeTxReceipt = await waitForTransaction(eth, tradeTxId);
    console.log(tradeTxReceipt);

    let trade: Trade | null = null;
    while (trade == null || trade.state === TradeState.Pending) {
      trade = await api.getTrade(tradeTxId);
      wait(1000);
    }

    if (trade.state === TradeState.Failed) {
      reportState({ stage: TxStage.TradeFailed, trade });
    } else {
      reportState({ stage: TxStage.TradeCompleted, trade });
    }
  } catch (err) {
    console.error(err);
    if (err.name === 'WalletError' && err.codeName === 'SignatureRejected') {
      reportState({ stage: TxStage.SignatureRejected });
    } else {
      reportState({ stage: TxStage.UnkownError });
    }
  }
}

function executeTradeObs(
  api: ServerApi,
  eth: Eth,
  account: Address,
  gasPrice: BN,
  token: Token,
  operation: Operation,
  tradeParams: TradeParameters
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    executeTrade(api, eth, account, gasPrice, token, operation, tradeParams, state =>
      observer.next(state)
    )
      .catch(err => observer.error(err))
      .then(() => observer.complete());

    return () => {
      console.log("can't unsubscribe to this observable");
    };
  });
}

export const executeTradeEpic = (api: ServerApi): Epic<WidgetState, Actions> => changes =>
  changes.pipe(
    filterAction('startTransaction'),
    switchMap(({ state }) => {
      const walletState = getCurrentWalletState(state);
      const accountState = getCurrentAccountState(state);

      if (walletState == null || accountState == null || walletState.status === 'error') {
        // something is wrong here
        console.log('invalid UI state: starting tx with no valid wallet');
        return empty();
      }

      if (state.orderSelection == null) {
        // something is wrong here
        console.log('invalid UI state: starting tx with no trade plan');
        return empty();
      }

      const gasPriceBN = computeGasPrice(state.config.gasprices, state.gasPrice);
      const ordersData = getOrdersData(state.orderSelection.orders);
      const volume = expectedVolume(state);
      const volumeEth = getFinalVolumeEth(state.orderSelection, volume, state.config.feePercentage);

      const tradeParameters: TradeParameters = {
        ordersData,
        volume,
        volumeEth,
      };

      return executeTradeObs(
        api,
        walletState.eth,
        accountState.address,
        gasPriceBN,
        state.token,
        state.operation,
        tradeParameters
      );
    }),
    map(setTransactionState)
  );
