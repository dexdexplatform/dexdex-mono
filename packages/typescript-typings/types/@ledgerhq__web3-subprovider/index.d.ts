declare module '@ledgerhq/web3-subprovider' {
  import Transport from '@ledgerhq/hw-transport';
  import HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet';

  export type SubproviderOptions = {
    // refer to https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
    networkId: number;
    // derivation path
    path?: string;
    // should use actively validate on the device
    askConfirm?: boolean;
    // number of accounts to derivate
    accountsLength?: number;
    // offset index to use to start derivating the accounts
    accountsOffset?: number;
  };

  /**
   * Create a HookedWalletSubprovider for Ledger devices.
   * @param getTransport gets lazily called each time the device is needed. It is a function that returns a Transport instance. You can typically give `()=>TransportU2F.create()`
   * @example
   *  import Web3 from "web3";
   *  import createLedgerSubprovider from "@ledgerhq/web3-subprovider";
   *  import TransportU2F from "@ledgerhq/hw-transport-u2f";
   *  import ProviderEngine from "web3-provider-engine";
   *  import RpcSubprovider from "web3-provider-engine/subproviders/rpc";
   *  const engine = new ProviderEngine();
   *  const getTransport = () => TransportU2F.create();
   *  const ledger = createLedgerSubprovider(getTransport, {
   *    accountsLength: 5
   *  });
   *  engine.addProvider(ledger);
   *  engine.addProvider(new RpcSubprovider({ rpcUrl }));
   *  engine.start();
   *  const web3 = new Web3(engine);
   */
  export default function createLedgerSubprovider(
    getTransport: () => Promise<Transport>,
    options?: SubproviderOptions
  ): HookedWalletSubprovider;
}
