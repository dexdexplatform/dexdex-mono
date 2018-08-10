import Erc20 from '@dexdex/erc20';
import { Address } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import { pollDifferences, seqAsync } from '@dexdex/rx';
import BN from 'bn.js';
import Eth from 'ethjs-query';
import { combineLatest, defer, empty, interval, Observable, of, race } from 'rxjs';
import {
  concatMap,
  delay,
  first,
  map,
  mapTo,
  repeatWhen,
  share,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { appConfig } from '../../config';
import { waitOnLoad } from '../../utils/wait-on-load';

export type WalletAccountRef = { wallet: WalletId; accountIdx: number };

export type EthNet = 'mainnet' | 'kovan' | 'ropsten' | 'morden' | 'rinkeby' | 'devnet';
export enum WalletId {
  MetaMask = 'MetaMask',
  Ledger = 'Ledger',
  Trezor = 'Trezor',
  Toshi = 'Toshi',
  Cipher = 'Cipher',
  Trust = 'Trust',
  Status = 'Status',
  BunToy = 'BunToy',
  Unkown = 'Unkown',
}

export type Provider = any;
export const DesktopWallets: WalletId[] = [WalletId.MetaMask, WalletId.Ledger, WalletId.Trezor];

export interface WalletInfo {
  icon: string;
  label: string;
}

async function getNetwork(eth: Eth): Promise<EthNet> {
  const netId = await eth.net_version();
  switch (netId) {
    case '1':
      return 'mainnet';
    case '2':
      return 'morden';
    case '3':
      return 'ropsten';
    case '4':
      return 'rinkeby';
    case '42':
      return 'kovan';
    default:
      return 'devnet';
  }
}

export const WalletInfo: Record<WalletId, { icon: string; label: string }> = {
  [WalletId.MetaMask]: {
    label: 'Metamask',
    icon: require('./icons/metamask.png'),
  },
  [WalletId.Ledger]: {
    label: 'Ledger',
    icon: require('./icons/ledger.png'),
  },
  [WalletId.Trezor]: {
    label: 'Trezor',
    icon: require('./icons/trezor.jpg'),
  },
  [WalletId.Toshi]: {
    label: 'Toshi',
    icon: require('./icons/toshi.png'),
  },
  [WalletId.Cipher]: {
    label: 'Cipher',
    icon: require('./icons/cipher.png'),
  },
  [WalletId.Trust]: {
    label: 'Trust',
    icon: require('./icons/trust.png'),
  },
  [WalletId.Status]: {
    label: 'Status',
    icon: require('./icons/status.png'),
  },
  [WalletId.BunToy]: {
    label: 'BunToy',
    icon: require('./icons/buntoy.png'),
  },
  [WalletId.Unkown]: {
    label: 'Unidentified',
    icon: require('./icons/unknown.png'),
  },
};

export interface AccountState {
  address: Address;
  balance: BN;
  tokenBalance: BN;
}

export interface WalletErrorState {
  walletId: WalletId;
  status: 'error';
  reason: string;
}
export interface WalletReadyState {
  walletId: WalletId;
  eth: Eth;
  status: 'ready';
  accounts: AccountState[];
}

export type WalletState = WalletErrorState | WalletReadyState;

const tryGetWeb3 = defer(() => {
  if ((window as any).web3 && (window as any).web3.currentProvider) {
    return of((window as any).web3.currentProvider);
  } else {
    return of(null);
  }
});

const injectedWeb3: Observable<Provider | null> =
  // first wait for page to be loaded
  waitOnLoad(
    race(
      tryGetWeb3.pipe(
        // try get web3 => provider | null
        repeatWhen(input => input.pipe(delay(100))), // repeat every 100ms
        first(val => val != null) // take first value != null and finish
      ),
      // wait for 3s max
      interval(3000).pipe(
        mapTo(null), // return null if couldn't find it
        first()
      )
    )
  ).pipe(share()); // do this just once

const errorState = (walletId: WalletId, reason: string): WalletErrorState => ({
  walletId,
  status: 'error',
  reason,
});
const readyState = (walletId: WalletId, eth: Eth, accounts: AccountState[]): WalletReadyState => ({
  status: 'ready',
  walletId,
  eth,
  accounts,
});

const accountStates = (
  eth: Eth,
  accountAddress: Address,
  currentToken: Observable<Token>
): Observable<AccountState> => {
  const etherBalance$ = pollDifferences({
    period: 60 * 1000,
    poller: () => eth.getBalance(accountAddress),
    compareFn: (a: BN, b: BN) => a.eq(b),
  }).pipe(startWith(new BN(0)));

  const tokenBalance$ = currentToken
    .pipe(
      switchMap(token => {
        const tokenContract = Erc20(eth, token.address);
        return pollDifferences({
          period: 60 * 1000,
          poller: () => tokenContract.balanceOf(accountAddress),
          compareFn: (a: BN, b: BN) => a.eq(b),
        }).pipe(startWith(new BN(0)));
      })
    )
    .pipe(startWith(new BN(0)));

  return combineLatest(etherBalance$, tokenBalance$, (etherBalance, tokenBalance) => ({
    address: accountAddress,
    balance: etherBalance,
    tokenBalance: tokenBalance,
  }));
};

const withNetworkCheck = (
  eth: Eth,
  walletId: WalletId,
  wallet$: Observable<WalletState>
): Observable<WalletState> =>
  seqAsync(
    () => getNetwork(eth),
    network => {
      if (network === appConfig().network) {
        return wallet$;
      } else {
        return of(errorState(walletId, `Please connect to ${appConfig().network}`));
      }
    }
  );

function compareArrays(a: Array<any>, b: Array<any>) {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function singleAccountWallet(
  walletId: WalletId,
  token: Observable<Token>,
  provider: Provider,
  pollAccount: boolean = false
): Observable<WalletState> {
  const eth = new Eth(provider);

  const accounts2States = (accounts: string[]): Observable<WalletState> => {
    if (accounts.length === 0) {
      return of(errorState(walletId, 'Not logged in'));
    } else {
      return combineLatest(accounts.map(address => accountStates(eth, address, token))).pipe(
        map(xs => readyState(walletId, eth, xs))
      );
    }
  };

  let wallet$: Observable<WalletState>;
  if (pollAccount) {
    wallet$ = pollDifferences({
      poller: () => eth.accounts(),
      compareFn: compareArrays,
      period: 100,
    }).pipe(switchMap(accounts2States));
  } else {
    wallet$ = seqAsync(() => eth.accounts(), accounts2States);
  }

  return withNetworkCheck(eth, walletId, wallet$);
}

export function metmaskWallet(token: Observable<Token>): Observable<WalletState> {
  return injectedWeb3.pipe(
    concatMap(provider => {
      if (provider && provider.isMetaMask) {
        // const metamaskProvider = decorateErrors(provider, metamaskErrorMapper);
        // return singleAccountWallet(WalletId.MetaMask, token, metamaskProvider, true);
        return singleAccountWallet(WalletId.MetaMask, token, provider, true);
      } else {
        return of(errorState(WalletId.MetaMask, 'Not installed'));
      }
    })
  );
}

function detectMobileWalletId(provider: any) {
  if (provider.isToshi) {
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
export function mobileWallet(token: Observable<Token>): Observable<WalletState> {
  return injectedWeb3.pipe(
    concatMap(provider => {
      if (provider) {
        const walletId = detectMobileWalletId(provider);
        return singleAccountWallet(walletId, token, provider, false);
      } else {
        return empty();
      }
    })
  );
}

export function ledgerWallet(token: Observable<Token>): Observable<WalletState> {
  return futureWallet(WalletId.Ledger);
}

export function trezorWallet(token: Observable<Token>): Observable<WalletState> {
  return futureWallet(WalletId.Trezor);
}

export function futureWallet(walletId: WalletId) {
  return of(errorState(walletId, 'Coming soon...'));
}
