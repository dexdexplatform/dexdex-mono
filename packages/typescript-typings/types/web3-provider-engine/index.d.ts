declare module 'web3-provider-engine' {
  import Subprovider from 'web3-provider-engine/subproviders/subprovider';

  export interface RPCPayload {
    params: any[];
    method: string;
    id: number;
    jsonrpc: string;
  }

  export interface RPCResponse {
    result: any;
    id: number;
    jsonrpc: string;
  }

  export interface RPCCallback {
    (error: null, response: RPCResponse): void;
    (error: Exclude<any, null>, response: undefined): void;
  }

  export interface Provider {
    send(payload: RPCPayload): void;
    sendAsync(payload: RPCPayload, callback: RPCCallback): void;
  }

  export interface Web3ProviderEngineOptions {
    pollingInterval?: number;
    blockTracker?: any;
    blockTrackerProvider?: any;
  }

  export default class Web3ProviderEngine implements Provider {
    constructor(options?: Web3ProviderEngineOptions);

    on(event: string, handler: (...args: any[]) => void): void;
    send(payload: RPCPayload): void;
    sendAsync(payload: RPCPayload, callback: RPCCallback): void;
    addProvider(provider: Subprovider): void;
    /** start block polling */
    start(callback?: () => void): void;
    /** stop block polling */
    stop(): void;
  }
}

declare module 'web3-provider-engine/subproviders/subprovider' {
  import Web3ProviderEngine, { Provider, RPCPayload, RPCCallback } from 'web3-provider-engine';

  export default abstract class Subprovider {
    setEngine(engine: Web3ProviderEngine): void;
    abstract handleRequest(payload: RPCPayload, next: () => void, end: RPCCallback): void;
    protected emitPayload(payload: RPCPayload, callback: RPCCallback): void;
  }
}

declare module 'web3-provider-engine/subproviders/nonce-tracker' {
  import { RPCPayload, RPCCallback } from 'web3-provider-engine';
  import Subprovider from 'web3-provider-engine/subproviders/subprovider';

  export default class NonceTrackerSubprovider extends Subprovider {
    handleRequest(payload: RPCPayload, next: () => void, end: RPCCallback): void;
  }
}

declare module 'web3-provider-engine/subproviders/hooked-wallet' {
  import { RPCPayload, RPCCallback } from 'web3-provider-engine';
  import Subprovider from 'web3-provider-engine/subproviders/subprovider';

  export interface Callback<A> {
    (err: null, value: A): void;
    (err: Exclude<any, null>, value: undefined): void;
  }
  export interface HookedWalletOpts {
    getAccounts: (cb: Callback<string[]>) => void;
    signPersonalMessage: (txData: any, cb: Callback<string>) => void;
    signTransaction: (txData: any, cb: Callback<string>) => void;
  }

  export default class HookedWalletSubprovider extends Subprovider {
    constructor(opts: HookedWalletOpts);
    handleRequest(payload: RPCPayload, next: () => void, end: RPCCallback): void;
  }
}
declare module 'web3-provider-engine/subproviders/filters';

declare module 'web3-provider-engine/subproviders/rpc' {
  import { RPCPayload, RPCCallback } from 'web3-provider-engine';
  import Subprovider from 'web3-provider-engine/subproviders/subprovider';

  export default class RpcSubprovider extends Subprovider {
    constructor(options: { rpcUrl: string });
    handleRequest(payload: RPCPayload, next: () => void, end: RPCCallback): void;
  }
}

declare module 'web3-provider-engine/subproviders/fetch' {
  import { RPCPayload, RPCCallback } from 'web3-provider-engine';
  import Subprovider from 'web3-provider-engine/subproviders/subprovider';

  export default class FetchSubprovider extends Subprovider {
    constructor(options: { rpcUrl: string });
    handleRequest(payload: RPCPayload, next: () => void, end: RPCCallback): void;
  }
}

declare module 'web3-provider-engine/util/rpc-cache-utils' {
  class ProviderEngineRpcUtils {
    public static blockTagForPayload(payload: any): string | null;
  }
  export = ProviderEngineRpcUtils;
}

declare module 'web3-provider-engine/subproviders/fixture' {
  import { RPCPayload, RPCCallback } from 'web3-provider-engine';
  import Subprovider from 'web3-provider-engine/subproviders/subprovider';

  export default class FixtureSubprovider extends Subprovider {
    constructor(staticResponses: any);
    handleRequest(payload: RPCPayload, next: () => void, end: RPCCallback): void;
  }
}
