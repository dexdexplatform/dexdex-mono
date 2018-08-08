import { WalletState } from '../widget-state/actions';
import Eth from 'ethjs-query';
import { injectedWalletDetector, getBalances } from '.';
import { WalletId } from './base';
import { appConfig } from '../../config';
import { Token } from '@dexdex/model/lib/token';

export type MetaMaskState =
  | { status: 'networkInvalid' | 'uninstalled' }
  | {
      status: 'ok';
      state: WalletState;
      eth: Eth;
    };

export async function getMetamaskState(token: Token): Promise<MetaMaskState> {
  const mWallet = await injectedWalletDetector.toPromise();
  if (mWallet == null || mWallet.id !== WalletId.MetaMask) {
    return { status: 'uninstalled' };
  } else if (mWallet.networkId !== appConfig().networkId) {
    return { status: 'networkInvalid' };
  } else {
    return {
      status: 'ok',
      eth: mWallet.eth,
      state: {
        address: mWallet.address,
        ...(await getBalances(mWallet.eth, mWallet.address, token)),
      },
    };
  }
}
