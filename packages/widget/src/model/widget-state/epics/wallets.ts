import { select } from '@dexdex/rx';
import { map } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { ledgerWallet, metmaskWallet, mobileWallet } from '../../wallets/index';
import { setWalletState } from '../actions';
import { merge } from 'rxjs';
import { isMobile } from '../../../config';

export const wallets: WidgetEpic = changes => {
  const currentToken$ = changes.pipe(select('state', 'tradeable'));

  const walletStates$ = isMobile
    ? mobileWallet(currentToken$)
    : merge(metmaskWallet(currentToken$), ledgerWallet(currentToken$));
  return walletStates$.pipe(map(setWalletState));
};
