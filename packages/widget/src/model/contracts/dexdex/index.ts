import Eth from 'ethjs-query';
import EthContract, { TxOptions, TxHash } from 'ethjs-contract';
import { BN } from 'bn.js';
import { Address } from '@dexdex/model/lib/base';

import * as CONTRACT_ABI from './dexdex.abi';

export interface DexDex {
  buy(
    token: Address,
    amountToBuy: BN,
    ordersData: string,
    destination: Address,
    affiliate: Address,
    txOption?: TxOptions
  ): Promise<TxHash>;

  sell(
    token: Address,
    amount: BN,
    ethers: BN,
    ordersData: string,
    destination: Address,
    affiliate: Address,
    txOption?: TxOptions
  ): Promise<TxHash>;
}

class DexDexWrapper implements DexDex {
  contract: any;

  constructor(eth: Eth, contractAddress: Address) {
    const contractFactory = EthContract(eth)(CONTRACT_ABI);
    this.contract = contractFactory.at(contractAddress);
  }

  buy(...args: any[]): Promise<TxHash> {
    return this.contract.buy(...args);
  }

  sell(...args: any[]): Promise<TxHash> {
    return this.contract.sell(...args);
  }
}

export default function create(eth: Eth, address: Address): DexDex {
  return new DexDexWrapper(eth, address);
}
