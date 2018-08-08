import { select } from '@dexdex/rx';
import BN from 'bn.js';
import { empty, merge, Observable } from 'rxjs';
import { distinctUntilChanged, first, map, mapTo, switchMap } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { WalletDetails } from '..';
import { isMobile } from '../../../config';
import { balanceWatcher, injectedWallet, injectedWeb3, walletAddressWatcher } from '../../wallets';
import { WalletId } from '../../wallets/base';
import { Actions, setWallet, setWalletState, showNoWalletModal } from '../actions';

function metaMaskAccountWatcher(
  currentWallet$: Observable<WalletDetails | null>
): Observable<Actions> {
  const onWalletIdChange$ = currentWallet$.pipe(
    distinctUntilChanged(
      (prev, curr) => prev === curr || (prev !== null && curr !== null && prev.id === curr.id)
    )
  );

  return onWalletIdChange$.pipe(
    switchMap(
      wallet =>
        wallet != null && wallet.id === WalletId.MetaMask
          ? walletAddressWatcher(wallet.eth)
          : empty()
    ),
    map(newAddress => {
      if (newAddress == null) {
        return setWallet(null);
      } else {
        return setWalletState({
          address: newAddress,
          balance: new BN(0),
          tokenBalance: new BN(0),
        });
      }
    })
  );
}

export const wallets: WidgetEpic = changes => {
  const currentToken$ = changes.pipe(select('state', 'token'));
  const currentWallet$ = changes.pipe(select('state', 'wallet'));

  return merge(
    injectedWallet.pipe(map(setWallet)),
    metaMaskAccountWatcher(currentWallet$),
    balanceWatcher(currentWallet$, currentToken$).pipe(map(setWalletState))
  );
};

export const noWalletWarning: WidgetEpic = changes => {
  if (isMobile) {
    // if we can't find a web3 provider, we open the mobile wallet modal
    return injectedWeb3.pipe(
      first(provider => provider == null),
      mapTo(showNoWalletModal())
    );
  } else {
    return empty();
  }
};
