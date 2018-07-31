import { select } from '@dexdex/rx';
import { empty, merge } from 'rxjs';
import { first, map, mapTo } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { isMobile } from '../../../config';
import {
  injectedWeb3,
  ledgerWallet,
  metmaskWallet,
  mobileWallet,
  trezorWallet,
} from '../../wallets/index';
import { setWalletState, showNoWalletModal } from '../actions';

export const wallets: WidgetEpic = changes => {
  const currentToken$ = changes.pipe(select('state', 'token'));

  const walletStates$ = isMobile
    ? mobileWallet(currentToken$)
    : merge(metmaskWallet(currentToken$), ledgerWallet(currentToken$), trezorWallet(currentToken$));
  return walletStates$.pipe(map(setWalletState));
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
