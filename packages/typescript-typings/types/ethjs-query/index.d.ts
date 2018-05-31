declare module 'ethjs-query' {
  import { BN } from 'bn.js';

  type Address = string;
  export interface Event {
    transactionHash: string;
  }
  export interface TransactionReceipt {
    contractAddress: string;
    gasUsed: BN;
  }
  export interface TransactionInfo {
    hash: string;
    nonce: BN;
    blockHash: string;
    blockNumber: BN;
    transactionIndex: BN;
    from: string;
    to: string;
    value: BN;
    gas: BN;
    gasPrice: BN;
    input: string;
  }

  class Eth {
    constructor(provider: any);

    accounts(): Promise<Address[]>;
    getBalance(account: Address): Promise<BN>;

    getTransactionReceipt(txHash: string): Promise<TransactionReceipt>;
    getTransactionByHash(txHash: string): Promise<TransactionInfo>;
    blockNumber(): Promise<BN>;
    sign(account: Address, str: string): Promise<string>;
  }

  export default Eth;
}
