declare module 'ethjs-contract' {
  import { BN } from 'bn.js';
  import Eth from 'ethjs-query';

  export type Address = string;
  export type TxHash = string;
  export type Abi = any[];

  function EthContract(eth: Eth): ContractFactoryCreator;

  export interface TxOptions {
    from?: Address;
    value?: BN;
    gas?: number | BN;
    gasPrice?: BN;
  }

  interface ContractFactoryCreator {
    (abi: Abi, bytecode?: any, defaultTxOptions?: TxOptions): ContractFactory;
  }

  interface ContractFactory {
    at(address: Address): Contract;
    new (txOptions?: TxOptions): Promise<Contract>;
    new <A0>(arg0: A0, txOptions?: TxOptions): Promise<Contract>;
    new <A0, A1>(arg0: A0, arg1: A1, txOptions?: TxOptions): Promise<Contract>;
    new <A0, A1, A2>(arg0: A0, arg1: A1, arg2: A2, txOptions?: TxOptions): Promise<Contract>;
    new <A0, A1, A2, A3>(arg0: A0, arg1: A1, arg2: A2, arg3: A3, txOptions?: TxOptions): Promise<
      Contract
    >;
    new <A0, A1, A2, A3, A4>(
      arg0: A0,
      arg1: A1,
      arg2: A2,
      arg3: A3,
      arg4: A4,
      txOptions?: TxOptions
    ): Promise<Contract>;
    new (...argsOrOptions: (any | TxOptions)[]): Promise<Contract>;
  }

  export interface Contract {
    defaultTxObject: TxOptions;
    address: Address;
    abi: Abi;
    bytecode?: any;
  }

  export default EthContract;
}
