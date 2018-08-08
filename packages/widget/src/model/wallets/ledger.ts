import { Token } from '@dexdex/model/lib/token';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import createLedgerSubprovider from '@ledgerhq/web3-subprovider';
import Eth from 'ethjs-query';
import ProviderEngine, { RPCPayload, RPCCallback } from 'web3-provider-engine';
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch';
import { getBalances } from '.';
import { appConfig } from '../../config';
import { WalletState } from '../widget-state/actions';
import { EthNet } from './base';
import Subprovider from 'web3-provider-engine/subproviders/subprovider';

const INFURA_API_KEY = 'T5WSC8cautR4KXyYgsRs';

const NodeUrls: Record<EthNet, string> = {
  mainnet: `https://mainnet.infura.io/${INFURA_API_KEY}`,
  kovan: `https://kovan.infura.io/${INFURA_API_KEY}`,
  ropsten: `https://ropsten.infura.io/${INFURA_API_KEY}`,
  rinkeby: `https://rinkeby.infura.io/${INFURA_API_KEY}`,
  morden: `https://morden.infura.io/${INFURA_API_KEY}`,
  devnet: `http://localhost:8545`,
};

// export function getLedgerProvider(ethnet: EthNet) {
//   // const isU2FSupported = await utils.isU2FSupportedAsync();
//   // if (!isU2FSupported) {
//   //     throw new Error('Cannot update providerType to LEDGER without U2F support');
//   // }
//   const networkId = 666;
//   const rpcUrl = NodeUrls[ethnet];

//   const engine = new ProviderEngine();
//   const getTransport = () => TransportU2F.create();
//   const ledger = createLedgerSubprovider(getTransport, {
//     networkId,
//     accountsLength: 5,
//   });
//   engine.addProvider(ledger);
//   engine.addProvider(new FetchSubprovider({ rpcUrl }));
//   engine.start();

//   return engine;
// }

class LogSubprovider extends Subprovider {
  handleRequest(payload: RPCPayload, next: () => void, end: RPCCallback) {
    if (['eth_getBlockByNumber'].indexOf(payload.method) === -1) {
      console.log(payload.method, payload.params);
    }
    next();
  }
}

export function getProvider() {
  const ethNet = appConfig().network;
  const networkId = appConfig().networkId;
  const rpcUrl = NodeUrls[ethNet];

  const engine = new ProviderEngine();
  const getTransport = async () => {
    const t = await TransportU2F.create();
    t.setExchangeTimeout(15000);
    return t;
  };
  const ledger = createLedgerSubprovider(getTransport, {
    networkId,
    accountsLength: 5,
  });
  engine.addProvider(new LogSubprovider());
  engine.addProvider(ledger);
  engine.addProvider(new FetchSubprovider({ rpcUrl }));
  engine.start();
  return engine;
}

export type LedgerState =
  | { status: 'disconnected' | 'oldbrowser' }
  | {
      status: 'ok';
      accounts: WalletState[];
      eth: Eth;
    };

export async function getLedgerState(token: Token): Promise<LedgerState> {
  const isSupported = await TransportU2F.isSupported();
  if (!isSupported) {
    return { status: 'oldbrowser' };
  }

  let accounts: string[];
  let eth: Eth;
  try {
    eth = new Eth(getProvider());
    accounts = await eth.accounts();
  } catch (err) {
    console.log(err);
    return { status: 'disconnected' };
  }

  const accountStates = await Promise.all(
    accounts.map(async account => {
      return {
        address: account,
        ...(await getBalances(eth, account, token)),
      };
    })
  );

  return { status: 'ok', eth, accounts: accountStates };
}
