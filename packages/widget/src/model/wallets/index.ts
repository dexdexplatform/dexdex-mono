import { BN } from 'bn.js';
import { Observable } from 'rxjs';
import { Address } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import * as injected from './injected';

export interface Wallet {
  name: string;
  icon: string;
  account: Observable<Address | null>;
  etherBalance: Observable<BN>;
  tradeableBalance: (token: Tradeable) => Observable<BN>;
  getAccount(): Promise<Address | null>;

  approveTokenAllowance(token: Tradeable, volume: BN, gasPrice: BN): Promise<string>;

  dexdexBuy(opts: {
    token: Address;
    volume: BN;
    volumeEth: BN;
    ordersData: string;
    affiliate: Address;
    gasPrice: BN;
  }): Promise<string>;

  dexdexSell(opts: {
    token: Address;
    volume: BN;
    volumeEth: BN;
    ordersData: string;
    affiliate: Address;
    gasPrice: BN;
  }): Promise<string>;
  waitForTransaction(txId: string): Promise<any>;
}

export async function getWallets(): Promise<Wallet[]> {
  const wallets: Wallet[] = [];

  const mInjected = await injected.tryGet();
  if (mInjected) {
    wallets.push(mInjected);
  }

  return wallets;
}
