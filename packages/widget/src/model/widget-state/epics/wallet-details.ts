import { combineLatest, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { setWalletDetails } from '../actions';

export const walletDetails: WidgetEpic = changes =>
  changes.pipe(
    map(ch => ({ wallet: ch.state.wallet, tradeable: ch.state.tradeable })),
    distinctUntilChanged((o, n) => o.wallet === n.wallet && o.tradeable === n.tradeable),
    switchMap(({ wallet, tradeable }) => {
      if (!wallet) {
        return of(setWalletDetails(null));
      }
      return combineLatest(
        wallet.account,
        wallet.etherBalance,
        wallet.tradeableBalance(tradeable)
      ).pipe(
        map(([address, etherBalance, tradeableBalance]) =>
          setWalletDetails({
            address,
            etherBalance,
            tradeableBalance,
          })
        )
      );
    })
  );
