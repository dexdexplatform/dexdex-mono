import { Operation } from '@dexdex/model/lib/base';
import { Trade } from '@dexdex/model/lib/trade';
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

async function executeTransaction(
  api: ServerApi,
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Tradeable,
  operation: Operation,
  plan: TradePlan,
  feePercentage: number,
  reportState: (newState: TransactionState) => void
) {
  try {
    if (operation === 'buy') {
      reportState({ stage: TxStage.RequestTradeSignature });
      const tradeTxId = await wallet.dexdexBuy({
        token: tradeable.address,
        volume: plan.currentVolume,
        volumeEth: getFinalVolumeEth(plan, feePercentage),
        ordersData: plan.getOrderParameters(),
        gasPrice,
        affiliate: NOAFFILIATE,
      });
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      console.log(tradeTxReceipt);

      let trade: Trade | null = null;
      while (trade == null) {
        trade = await api.getTrade(tradeTxId);
      }

      reportState({ stage: TxStage.Completed, trade });
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
      const tradeTxId = await wallet.dexdexSell({
        token: tradeable.address,
        volume: plan.currentVolume,
        volumeEth: getFinalVolumeEth(plan, feePercentage),
        ordersData: plan.getOrderParameters(),
        gasPrice,
        affiliate: NOAFFILIATE,
      });
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      console.log(tradeTxReceipt);

      let trade: Trade | null = null;
      while (trade == null) {
        trade = await api.getTrade(tradeTxId);
      }

      reportState({ stage: TxStage.Completed, trade });
    }
  } catch (err) {
    console.error(err);
    if (err.name === 'WalletError' && err.codeName === 'SignatureRejected') {
      reportState({ stage: TxStage.SignatureRejected });
    } else {
      reportState({ stage: TxStage.Failed });
    }
  }
}

function executeTransactionObs(
  api: ServerApi,
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Tradeable,
  operation: Operation,
  plan: TradePlan,
  feePercentage: number
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    executeTransaction(api, wallet, gasPrice, tradeable, operation, plan, feePercentage, state =>
      observer.next(state)
    )
      .catch(err => observer.error(err))
      .then(() => observer.complete());

    return () => {
      console.log("can't unsubscribe to this observable");
    };
  });
}

export const runTransaction = (api: ServerApi): Epic<WidgetState, Actions> => changes =>
  changes.pipe(
    filterAction('startTransaction'),
    switchMap(({ state }) => {
      if (state.wallet && state.tradePlan) {
        const gasPriceBN = computeGasPrice(state.config.gasprices, state.gasPrice);
        const plan = state.tradePlan;
        return executeTransactionObs(
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
