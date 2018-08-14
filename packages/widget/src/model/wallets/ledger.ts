import { Token } from '@dexdex/model/lib/token';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import EthApp from '@ledgerhq/hw-app-eth';
import createLedgerSubprovider from '@ledgerhq/web3-subprovider';
import Eth from 'ethjs-query';
import ProviderEngine from 'web3-provider-engine';
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch';
import { getBalances } from '.';
import { appConfig, getNodeUrl } from '../../config';
import { WalletState } from '../widget-state/actions';

export enum LedgetStatus {
  Unsupported = 'Unsupported',
  NotConnected = 'NotConnected',
  NoSmartContractSupport = 'NoSmartContractSupport',
  Ok = 'Ok',
}

export async function isLedgerConnected() {
  const currentStatus = await senseLedgerStatus();
  return currentStatus === LedgetStatus.Ok;
}

export async function senseLedgerStatus() {
  const isSupported = await TransportU2F.isSupported();
  if (!isSupported) {
    return LedgetStatus.Unsupported;
  }

  const t = await TransportU2F.create();
  try {
    t.setExchangeTimeout(2000);
    const ethApp = new EthApp(t);
    const ethAppConfig = await ethApp.getAppConfiguration();
    t.close();
    if (ethAppConfig.arbitraryDataEnabled === 0) {
      return LedgetStatus.NoSmartContractSupport;
    } else {
      return LedgetStatus.Ok;
    }
  } catch (err) {
    if (err.originalError && err.originalError.metaData && err.originalError.metaData.code === 5) {
      return LedgetStatus.NotConnected;
    }
    t.close();
    throw err;
  }
}

export function getProvider() {
  const ethNet = appConfig().network;
  const networkId = appConfig().networkId;
  const rpcUrl = getNodeUrl(ethNet);

  const engine = new ProviderEngine();
  const getTransport = async () => TransportU2F.create();

  const ledger = createLedgerSubprovider(getTransport, {
    networkId,
    accountsLength: 5,
  });
  engine.addProvider(ledger);
  engine.addProvider(new FetchSubprovider({ rpcUrl }));
  engine.start();
  return engine;
}

export type LedgerState =
  | { status: Exclude<LedgetStatus, LedgetStatus.Ok> }
  | {
      status: LedgetStatus.Ok;
      accounts: WalletState[];
      eth: Eth;
    };

export async function getLedgerState(token: Token): Promise<LedgerState> {
  const status = await senseLedgerStatus();

  if (status !== LedgetStatus.Ok) {
    return { status };
  }

  let accounts: string[];
  let eth: Eth;
  try {
    eth = new Eth(getProvider());
    accounts = await eth.accounts();
  } catch (err) {
    console.log(err);
    return { status: LedgetStatus.NotConnected };
  }

  const accountStates = await Promise.all(
    accounts.map(async account => {
      return {
        address: account,
        ...(await getBalances(eth, account, token)),
      };
    })
  );

  return { status: LedgetStatus.Ok, eth, accounts: accountStates };
}
