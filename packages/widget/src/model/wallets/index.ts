import Erc20 from '@dexdex/erc20';
import { Address } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import { pollDifferences } from '@dexdex/rx';
import BN from 'bn.js';
import Eth from 'ethjs-query';
import { combineLatest, defer, empty, interval, Observable, of, race } from 'rxjs';
import {
  concatMap,
  delay,
  distinctUntilChanged,
  filter,
  first,
  mapTo,
  repeatWhen,
  share,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { appConfig } from '../../config';
import { waitOnLoad } from '../../utils/wait-on-load';
import { Wallet } from '../widget-state';
import { WalletState } from '../widget-state/actions';
import { Provider, WalletId } from './base';

const tryGetWeb3 = defer(() => {
  if ((window as any).web3 && (window as any).web3.currentProvider) {
    return of((window as any).web3.currentProvider);
  } else {
    return of(null);
  }
});

function timeout<A>(ms: number, defaultValue: A | Observable<A>) {
  return (input: Observable<A>) =>
    race(
      input,
      interval(ms).pipe(
        mapTo(defaultValue),
        first()
      )
    );
}

export const injectedWeb3: Observable<Provider | null> = tryGetWeb3.pipe(
  // tryGetWeb3 is a one time try of getting a provider
  repeatWhen(input => input.pipe(delay(100))), // repeat tryGetWeb3 every 100ms
  first(val => val != null), // stop after one try return != null
  timeout(3000, null), // don't run forever, timeout after 3s and emit null
  waitOnLoad, // do ALL that, but first wait for page to be loaded
  share() // do ALL that, just once for concurrent subscribers
);

export function getWalletId(provider: any): WalletId {
  if (provider.isMetaMask) {
    return WalletId.MetaMask;
  } else if (provider.isToshi) {
    return WalletId.Toshi;
  } else if (provider.isCipher) {
    return WalletId.Cipher;
  } else if (provider.isTrust) {
    return WalletId.Trust;
  } else if (provider.isStatus) {
    return WalletId.Status;
  } else if (provider.isBunToy) {
    return WalletId.BunToy;
  } else {
    return WalletId.Unkown;
  }
}

export const injectedWalletDetector: Observable<Wallet | null> = injectedWeb3.pipe(
  concatMap(async provider => {
    if (provider === null) {
      return null;
    }

    const eth = new Eth(provider);
    const accounts = await eth.accounts();

    if (accounts.length !== 1) {
      return null;
    }

    return {
      id: getWalletId(provider),
      eth,
      address: accounts[0],
      networkId: Number(await eth.net_version()),
    };
  })
);

export const injectedWallet: Observable<Wallet> = injectedWalletDetector.pipe(
  filter((x): x is Wallet => x != null && x.networkId === appConfig().networkId)
);

export function walletAddressWatcher(eth: Eth): Observable<null | Address> {
  return pollDifferences({
    poller: async () => {
      const accounts = await eth.accounts();
      return accounts.length > 0 ? accounts[0] : null;
    },
    period: 100,
  });
}

function tokenBalanceWatcher(eth: Eth, account: Address, token: Token) {
  const tokenContract = Erc20(eth, token.address);
  return pollDifferences({
    period: 60 * 1000,
    poller: () => tokenContract.balanceOf(account),
    compareFn: (a: BN, b: BN) => a.eq(b),
  }).pipe(startWith(new BN(0)));
}

function mutableTokenBalanceWatcher(eth: Eth, account: Address, token$: Observable<Token>) {
  return token$
    .pipe(switchMap(token => tokenBalanceWatcher(eth, account, token)))
    .pipe(startWith(new BN(0)));
}

function etherBalanceWatcher(eth: Eth, account: Address) {
  return pollDifferences({
    period: 60 * 1000,
    poller: () => eth.getBalance(account),
    compareFn: (a: BN, b: BN) => a.eq(b),
  }).pipe(startWith(new BN(0)));
}

function accountBalances(
  eth: Eth,
  account: Address,
  currentToken: Observable<Token>
): Observable<WalletState> {
  const etherBalance$ = etherBalanceWatcher(eth, account);
  const tokenBalance$ = mutableTokenBalanceWatcher(eth, account, currentToken);

  return combineLatest(etherBalance$, tokenBalance$, (etherBalance, tokenBalance) => ({
    address: account,
    balance: etherBalance,
    tokenBalance: tokenBalance,
  }));
}

export function balanceWatcher(
  wallet$: Observable<Wallet | null>,
  currentToken$: Observable<Token>
) {
  const walletAddressChange = wallet$.pipe(
    distinctUntilChanged(
      (prev, curr) =>
        prev === curr || (prev !== null && curr !== null && prev.address === curr.address)
    )
  );

  return walletAddressChange.pipe(
    switchMap(
      wallet =>
        wallet !== null ? accountBalances(wallet.eth, wallet.address, currentToken$) : empty()
    )
  );
}

export function singleAccountWalletWatcher(wallet: Wallet, currentToken$: Observable<Token>) {
  return walletAddressWatcher(wallet.eth).pipe(
    switchMap(address => {
      if (address == null) {
        return of(null);
      } else {
        return accountBalances(wallet.eth, address, currentToken$);
      }
    })
  );
}

export async function getBalances(eth: Eth, account: Address, token: Token) {
  const tokenContract = Erc20(eth, token.address);
  return {
    balance: await eth.getBalance(account),
    tokenBalance: await tokenContract.balanceOf(account),
  };
}
