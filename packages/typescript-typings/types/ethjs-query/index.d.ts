declare module 'ethjs-query' {
  import { BN } from 'bn.js';

  type Address = string;

  export interface TransactionReceipt {}

  class Eth {
    constructor(provider: any);

    accounts(): Promise<Address[]>;
    getBalance(account: Address): Promise<BN>;

    getTransactionReceipt(txHash: string): Promise<TransactionReceipt>;
  }

  export default Eth;
}
