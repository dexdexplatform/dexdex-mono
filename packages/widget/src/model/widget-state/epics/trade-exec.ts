import { Operation } from '@dexdex/model/lib/base';
import { getOrdersData } from '@dexdex/model/lib/order';
import { getFinalVolumeEth } from '@dexdex/model/lib/order-selection';
import { Token } from '@dexdex/model/lib/token';
import { Trade, TradeState } from '@dexdex/model/lib/trade';
import BN from 'bn.js';
import Eth, { Address, TransactionReceipt } from 'ethjs-query';
import { empty, Observable, Observer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WidgetState } from '..';
import Erc20 from '@dexdex/erc20';
import { appConfig } from '../../../config';
import DexDex from '../../contracts/dexdex';
import { ServerApi } from '../../server-api';
import { computeGasPrice, TransactionState, TxStage } from '../../widget';
import { Actions, setTransactionState } from '../actions';
import { expectedVolume } from '../selectors';
import { Epic } from '../store';
import { filterAction } from './utils';

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

    console.log(opts.token, opts.volume.toString(), opts.ordersData, opts.account, opts.affiliate);
    console.log(opts.volumeEth.toString());
    return await dexdex.buy(
      opts.token,
      opts.volume,
      opts.ordersData,
      opts.account,
      opts.affiliate,
      {
        from: opts.account,
        value: opts.volumeEth,
        gas: estimatedGas.muln(1.5),
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

async function needsTokenAllowance(
  eth: Eth,
  account: Address,
  token: Token,
  volume: BN
): Promise<boolean> {
  const ourAddress = appConfig().ContractAddress;
  const erc20 = Erc20(eth, token.address);

  const currentAllowance = await erc20.allowance(account, ourAddress);
  return currentAllowance.lt(volume);
}

async function approveTokenAllowance(
  eth: Eth,
  account: Address,
  token: Token,
  gasPrice: BN
): Promise<string> {
  const ourAddress = appConfig().ContractAddress;
  const erc20 = Erc20(eth, token.address);
  // MaxVolume = 2^256 -1
  const MaxVolume = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16);
  return erc20.approve(ourAddress, MaxVolume, { from: account, gasPrice });
}

async function executeTrade(
  api: ServerApi,
  eth: Eth,
  account: Address,
  gasPrice: BN,
  token: Token,
  operation: Operation,
  affiliateAddress: Address,
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
        affiliate: affiliateAddress,
      });
    } else {
      if (await needsTokenAllowance(eth, account, token, tradeParams.volume)) {
        reportState({ stage: TxStage.RequestTokenAllowanceSignature });
        const allowanceTxId = await approveTokenAllowance(eth, account, token, gasPrice);
        reportState({ stage: TxStage.TokenAllowanceInProgress, txId: allowanceTxId });
        await waitForTransaction(eth, allowanceTxId);
      }

      reportState({ stage: TxStage.RequestTradeSignature });
      tradeTxId = await dexdexSell({
        eth,
        account,
        token: token.address,
        volume: tradeParams.volume,
        volumeEth: tradeParams.volumeEth,
        ordersData: tradeParams.ordersData,
        gasPrice,
        affiliate: affiliateAddress,
      });
    }

    reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
    const tradeTxReceipt = await waitForTransaction(eth, tradeTxId);
    console.log(tradeTxReceipt);

    let trade: Trade | null = null;
    while (trade == null || trade.state === TradeState.Pending) {
      trade = await api.getTrade(tradeTxId);
      await wait(1000);
    }

    if (trade.state === TradeState.Failed) {
      reportState({ stage: TxStage.TradeFailed, trade });
    } else {
      reportState({ stage: TxStage.TradeCompleted, trade });
    }
  } catch (err) {
    if (
      err.message &&
      err.message.includes('MetaMask Tx Signature: User denied transaction signature.')
    ) {
      reportState({ stage: TxStage.SignatureRejected });
    } else {
      console.error(err);
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
  affiliateAddress: Address,
  tradeParams: TradeParameters
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    executeTrade(
      api,
      eth,
      account,
      gasPrice,
      token,
      operation,
      affiliateAddress,
      tradeParams,
      state => observer.next(state)
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
      const wallet = state.wallet;

      if (wallet == null || wallet.networkId !== appConfig().networkId) {
        // something is wrong here
        console.log('invalid UI state: starting tx with no valid wallet');
        return empty();
      }

      if (state.orderSelection == null) {
        // something is wrong here
        console.log('invalid UI state: starting tx with no trade plan');
        return empty();
      }

      const affiliateAddress = state.config.affiliateAddress;
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
        wallet.eth,
        wallet.address,
        gasPriceBN,
        state.token,
        state.operation,
        affiliateAddress,
        tradeParameters
      );
    }),
    map(setTransactionState)
  );
