import { Address } from '@dexdex/model/lib/base';
import { BN } from 'bn.js';
import { Observable, of, combineLatest, empty } from 'rxjs';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { promiseFactory, seqAsync, pollDifferences } from '@dexdex/rx';
import { share, concatMap, switchMap, startWith, map } from 'rxjs/operators';
import Eth from 'ethjs-query';
import Erc20 from '@dexdex/erc20';

export type WalletAccountRef = { wallet: WalletId; accountIdx: number };

export enum WalletId {
  MetaMask = 'MetaMask',
  Ledger = 'Ledger',
  Toshi = 'Toshi',
  Cipher = 'Cipher',
  Trust = 'Trust',
  Status = 'Status',
  Unkown = 'Unkown',
}

export const DesktopWallets: WalletId[] = [WalletId.MetaMask, WalletId.Ledger];

export interface WalletInfo {
  icon: string;
  label: string;
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

type Provider = any;

function getWeb3Provider(): Provider | null {
  const web3 = (window as any).web3;
  if (typeof web3 !== 'undefined') {
    return web3.currentProvider;
  }
  return null;
}

export function getOnLoad<A>(onLoadGetter: () => A): Promise<A> {
  return new Promise(resolve => {
    switch (document.readyState) {
      case 'loading':
        window.addEventListener('load', () => resolve(onLoadGetter()));
        return;
      default:
        resolve(onLoadGetter());
    }
  });
}

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

const injectedWeb3 = promiseFactory(() => getOnLoad(getWeb3Provider)).pipe(share());

const accountStates = (
  eth: Eth,
  accountAddress: Address,
  currentToken: Observable<Tradeable>
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

function singleAccountWallet(
  walletId: WalletId,
  token: Observable<Tradeable>,
  provider: Provider,
  pollAccount: boolean = false
): Observable<WalletState> {
  const eth = new Eth(provider);

  if (pollAccount) {
    return pollDifferences({
      poller: async () => {
        const accounts = await eth.accounts();
        if (accounts && accounts.length === 1) {
          return accounts[0];
        } else {
          return null;
        }
      },
      period: 100,
    }).pipe(
      switchMap(mAccount => {
        if (mAccount == null) {
          return of(errorState(walletId, 'No Accounts'));
        } else {
          return combineLatest([mAccount].map(address => accountStates(eth, address, token))).pipe(
            map(xs => readyState(walletId, eth, xs))
          );
        }
      })
    );
  } else {
    return seqAsync(
      () => eth.accounts(),
      (accounts): Observable<WalletState> => {
        if (accounts.length === 0) {
          return of(errorState(walletId, 'No Accounts'));
        } else {
          return combineLatest(accounts.map(address => accountStates(eth, address, token))).pipe(
            map(xs => readyState(walletId, eth, xs))
          );
        }
      }
    );
  }
}

export function metmaskWallet(token: Observable<Tradeable>): Observable<WalletState> {
  return injectedWeb3.pipe(
    concatMap(provider => {
      if (provider && provider.isMetaMask) {
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
  } else {
    return WalletId.Unkown;
  }
}
export function mobileWallet(token: Observable<Tradeable>): Observable<WalletState> {
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

export function ledgerWallet(token: Observable<Tradeable>): Observable<WalletState> {
  return futureWallet(WalletId.Ledger);
}

export function futureWallet(walletId: WalletId) {
  return of(errorState(walletId, 'Coming soon...'));
}

/*

Wallet => Ok | Error

When Wallet Ok => get Accounts (once or several times)

For each account => poll balance
For each account => poll current token balance (need current token, react to token change)


Operate over account:
 - approve allowance
 - dexdex buy
 - dexdex sell

we need (web3 + account address)


UI State:

- Wallet List, each Wallet has:
  - Accounts:
    - address
    - balance
    - token balance
- Current Account+Wallet

- service(web3,AccountAddress)
  - approveAllowance
  - dexdexBuy
  - dexdexSell


Otra forma;

 - Wallets:
  - walletId -> status
 - Accounts:
  - accountAddress + walletId
 - balance
  - accountAddress -> balance
 - tokens balance
  - tokenAddress
    -accountAddress -> balance


*/
