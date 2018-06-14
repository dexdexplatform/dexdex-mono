import { BN } from 'bn.js';
import Eth, { TransactionReceipt } from 'ethjs-query';
import { Observable, of } from 'rxjs';
import { publishReplay, refCount, switchMap } from 'rxjs/operators';
import { Wallet } from '.';
import { pollDifferences } from '@dexdex/rx';
import { Address } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import DexDex from '../contracts/dexdex';
import Erc20 from '@dexdex/erc20';
import * as WalletErrors from './errors';
import { ContractAddress } from '../../config';

const KnowWallets = [
  {
    name: 'Metamask',
    icon: require('./icons/metamask.png'),
    condition: (web3: any) => web3.currentProvider.isMetaMask,
  },
  {
    name: 'Toshi',
    icon: require('./icons/toshi.png'),
    condition: (web3: any) => web3.currentProvider.isToshi,
  },
];

function getWeb3(): { eth: Eth; name: string; icon: string } | null {
  const web3 = (window as any).web3;
  if (typeof web3 !== 'undefined') {
    for (const kw of KnowWallets) {
      if (kw.condition(web3)) {
        return {
          eth: new Eth(web3.currentProvider),
          name: kw.name,
          icon: kw.icon,
        };
      }
    }
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

function toWalletError(err: any) {
  if (err.value && err.value.message) {
    if (
      err.value.message.indexOf(
        'Error: MetaMask Tx Signature: User denied transaction signature'
      ) >= 0
    ) {
      return WalletErrors.signatureRejected();
    }
    return err;
  }
  return err;
}

class InjectedWallet implements Wallet {
  account = pollDifferences({
    period: 100,
    poller: () => this.getAccount(),
  }).pipe(
    publishReplay(1),
    refCount()
  );

  etherBalance = this.account.pipe(
    switchMap(account => {
      if (account) {
        return pollDifferences({
          period: 60 * 1000,
          poller: () => this.eth.getBalance(account),
          compareFn: (a: BN, b: BN) => a.eq(b),
        });
      } else {
        return of(new BN(0));
      }
    })
  );

  constructor(readonly eth: Eth, readonly name: string, readonly icon: string) {}

  async getAccount(): Promise<Address | null> {
    const accounts = await this.eth.accounts();
    return accounts[0] || null;
  }

  tradeableBalance(token: Tradeable): Observable<BN> {
    const tokenContract = Erc20(this.eth, token.address);

    return this.account.pipe(
      switchMap(account => {
        if (account) {
          return pollDifferences({
            period: 60 * 1000,
            poller: () => tokenContract.balanceOf(account),
            compareFn: (a: BN, b: BN) => a.eq(b),
          });
        } else {
          return of(new BN(0));
        }
      })
    );
  }

  async dexdexBuy(opts: {
    token: Address;
    volume: BN;
    volumeEth: BN;
    ordersData: string;
    affiliate: Address;
    gasPrice: BN;
  }): Promise<string> {
    try {
      const account = await this.getAccount();
      if (account == null) {
        throw new Error('No selected account');
      }
      const dexdex = DexDex(this.eth, ContractAddress);
      return await dexdex.buy(opts.token, opts.volume, opts.ordersData, account, opts.affiliate, {
        from: account,
        value: opts.volumeEth,
        gasPrice: opts.gasPrice,
      });
    } catch (err) {
      throw toWalletError(err);
    }
  }

  async dexdexSell(opts: {
    token: Address;
    volume: BN;
    volumeEth: BN;
    ordersData: string;
    affiliate: Address;
    gasPrice: BN;
  }): Promise<string> {
    try {
      const account = await this.getAccount();
      if (account == null) {
        throw new Error('No selected account');
      }
      const dexdex = DexDex(this.eth, ContractAddress);
      return await dexdex.sell(
        opts.token,
        opts.volume,
        opts.volumeEth,
        opts.ordersData,
        account,
        opts.affiliate,
        { from: account, gasPrice: opts.gasPrice }
      );
    } catch (err) {
      throw toWalletError(err);
    }
  }

  async waitForTransaction(txId: string): Promise<TransactionReceipt> {
    let txReceipt;
    while (!txReceipt) {
      try {
        txReceipt = await this.eth.getTransactionReceipt(txId);
      } catch (err) {
        console.log('errror', err);
      }
    }

    return txReceipt;
  }

  async approveTokenAllowance(token: Tradeable, volume: BN, gasPrice: BN): Promise<string> {
    const account = await this.getAccount();
    if (account == null) {
      throw new Error('No selected account');
    }
    const tokenContract = Erc20(this.eth, token.address);
    return tokenContract.approve(ContractAddress, volume, { from: account, gasPrice });
  }
}

export async function tryGet(): Promise<Wallet | null> {
  const mEth = await getOnLoad(getWeb3);
  if (mEth) {
    return new InjectedWallet(mEth.eth, mEth.name, mEth.icon);
  }
  return null;
}
