import { Operation } from '@dexdex/model/lib/base';
import { Trade, TradeState } from '@dexdex/model/lib/trade';
import { TradePlan, getFinalVolumeEth } from '@dexdex/model/lib/trade-plan';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { BN } from 'bn.js';
import { Observable, Observer, empty } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WidgetState } from '..';
import { ServerApi } from '../../server-api';
import { Wallet } from '../../wallets';
import { TransactionState, TxStage, computeGasPrice } from '../../widget';
import { Actions, setTransactionState } from '../actions';
import { Epic } from '../store';
import { filterAction } from './utils';

const NOAFFILIATE = '0x0000000000000000000000000000000000000000';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function executeTrade(
  api: ServerApi,
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Tradeable,
  operation: Operation,
  plan: TradePlan,
  feePercentage: number,
  reportState: (newState: TransactionState) => void
) {
  let tradeTxId: string;
  try {
    if (operation === 'buy') {
      reportState({ stage: TxStage.RequestTradeSignature });
      tradeTxId = await wallet.dexdexBuy({
        token: tradeable.address,
        volume: plan.currentVolume,
        volumeEth: getFinalVolumeEth(plan, feePercentage),
        ordersData: plan.getOrderParameters(),
        gasPrice,
        affiliate: NOAFFILIATE,
      });
    } else {
      reportState({ stage: TxStage.RequestTokenAllowanceSignature });
      const allowanceTxId = await wallet.approveTokenAllowance(
        tradeable,
        plan.currentVolume,
        gasPrice
      );
      reportState({ stage: TxStage.TokenAllowanceInProgress, txId: allowanceTxId });
      await wallet.waitForTransaction(allowanceTxId);

      reportState({ stage: TxStage.RequestTradeSignature });
      tradeTxId = await wallet.dexdexSell({
        token: tradeable.address,
        volume: plan.currentVolume,
        volumeEth: getFinalVolumeEth(plan, feePercentage),
        ordersData: plan.getOrderParameters(),
        gasPrice,
        affiliate: NOAFFILIATE,
      });
    }

    reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
    const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
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
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Tradeable,
  operation: Operation,
  plan: TradePlan,
  feePercentage: number
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    executeTrade(api, wallet, gasPrice, tradeable, operation, plan, feePercentage, state =>
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
      if (state.wallet && state.tradePlan) {
        const gasPriceBN = computeGasPrice(state.config.gasprices, state.gasPrice);
        const plan = state.tradePlan;
        return executeTradeObs(
          api,
          state.wallet,
          gasPriceBN,
          state.tradeable,
          state.operation,
          plan,
          state.config.feePercentage
        );
      } else {
        return empty();
      }
    }),
    map(setTransactionState)
  );
