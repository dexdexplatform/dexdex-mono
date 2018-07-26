import Eth from 'ethjs-query';
import abi from 'ethjs-abi';
import EthContract, { TxOptions, TxHash } from 'ethjs-contract';
import BN from 'bn.js';
import { Address } from '@dexdex/model/lib/base';

import * as CONTRACT_ABI from './dexdex.abi';

export interface DexDex {
  estimateGasForBuy(
    eth: Eth,
    token: Address,
    amountToBuy: BN,
    ordersData: string,
    destination: Address,
    affiliate: Address,
    txOption: TxOptions
  ): Promise<BN>;

  estimateGasForSell(
    eth: Eth,
    token: Address,
    amount: BN,
    ethers: BN,
    ordersData: string,
    destination: Address,
    affiliate: Address,
    txOption: TxOptions
  ): Promise<BN>;

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

  estimateGasForBuy(
    eth: Eth,
    token: Address,
    amountToBuy: BN,
    ordersData: string,
    destination: Address,
    affiliate: Address,
    txOption: TxOptions
  ): Promise<BN> {
    const abiFunction = CONTRACT_ABI.find((el: any) => {
      return el.name === 'buy';
    });
    const inputBytecode = abi.encodeMethod(abiFunction, [
      token,
      amountToBuy,
      ordersData,
      destination,
      affiliate,
    ]);
    return eth.estimateGas({
      to: this.contract.address,
      from: txOption.from,
      value: txOption.value,
      gas: new BN('6000000'),
      gasPrice: txOption.gasPrice,
      data: inputBytecode,
    });
  }

  estimateGasForSell(
    eth: Eth,
    token: Address,
    amount: BN,
    ethers: BN,
    ordersData: string,
    destination: Address,
    affiliate: Address,
    txOption: TxOptions
  ): Promise<BN> {
    const abiFunction = CONTRACT_ABI.find((el: any) => {
      return el.name === 'sell';
    });
    const inputBytecode = abi.encodeMethod(abiFunction, [
      token,
      amount,
      ethers,
      ordersData,
      destination,
      affiliate,
    ]);
    return eth.estimateGas({
      to: this.contract.address,
      from: txOption.from,
      gas: new BN('6000000'),
      gasPrice: txOption.gasPrice,
      data: inputBytecode,
    });
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
