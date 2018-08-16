import { Address } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import BN from 'bn.js';
import Eth from 'ethjs-query';
import { combineLatest, Observable } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import Erc20 from '@dexdex/erc20';
import { pollDifferences } from '@dexdex/rx';

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

export async function getNetwork(eth: Eth): Promise<EthNet> {
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

export const accountStates = (
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
