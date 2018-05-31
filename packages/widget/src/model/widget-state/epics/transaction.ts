import { Operation } from '@dexdex/model/lib/base';
import { Trade, getFinalVolumeEth } from '@dexdex/model/lib/trade';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { BN } from 'bn.js';
import { Observable, Observer, empty } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { Wallet } from '../../wallets';
import { TransactionState, TxStage, computeGasPrice } from '../../widget';
import { setTransactionState } from '../actions';
import { filterAction } from './utils';

const NOAFFILIATE = '0x0000000000000000000000000000000000000000';

async function executeTransaction(
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Tradeable,
  operation: Operation,
  tx: Trade,
  feePercentage: number,
  reportState: (newState: TransactionState) => void
) {
  try {
    if (operation === 'buy') {
      reportState({ stage: TxStage.RequestTradeSignature });
      const tradeTxId = await wallet.dexdexBuy({
        token: tradeable.address,
        volume: tx.currentVolume,
        volumeEth: getFinalVolumeEth(tx, feePercentage),
        ordersData: tx.getOrderParameters(),
        gasPrice,
        affiliate: NOAFFILIATE,
      });
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      console.log(tradeTxReceipt);
      reportState({ stage: TxStage.Completed });
    } else {
      reportState({ stage: TxStage.RequestTokenAllowanceSignature });
      const allowanceTxId = await wallet.approveTokenAllowance(
        tradeable,
        tx.currentVolume,
        gasPrice
      );
      reportState({ stage: TxStage.TokenAllowanceInProgress, txId: allowanceTxId });
      await wallet.waitForTransaction(allowanceTxId);

      reportState({ stage: TxStage.RequestTradeSignature });
      const tradeTxId = await wallet.dexdexSell({
        token: tradeable.address,
        volume: tx.currentVolume,
        volumeEth: getFinalVolumeEth(tx, feePercentage),
        ordersData: tx.getOrderParameters(),
        gasPrice,
        affiliate: NOAFFILIATE,
      });
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      console.log(tradeTxReceipt);
      reportState({ stage: TxStage.Completed });
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
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Tradeable,
  operation: Operation,
  tx: Trade,
  feePercentage: number
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    executeTransaction(wallet, gasPrice, tradeable, operation, tx, feePercentage, state =>
      observer.next(state)
    )
      .catch(err => observer.error(err))
      .then(() => observer.complete());

    return () => {
      console.log("can't unsubscribe to this observable");
    };
  });
}

export const runTransaction: WidgetEpic = changes =>
  changes.pipe(
    filterAction('startTransaction'),
    switchMap(({ state }) => {
      if (state.wallet && state.currentTrade) {
        const gasPriceBN = computeGasPrice(state.config.gasprices, state.gasPrice);
        const tx = state.currentTrade;
        return executeTransactionObs(
          state.wallet,
          gasPriceBN,
          state.tradeable,
          state.operation,
          tx,
          state.config.feePercentage
        );
      } else {
        return empty();
      }
    }),
    map(setTransactionState)
  );
