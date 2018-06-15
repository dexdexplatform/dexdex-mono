import { Address } from '@dexdex/model/lib/base';

export type EthNet = 'main' | 'kovan';

const searchParams = new URLSearchParams(window.location.hash.slice(1));

function readNet(): EthNet {
  const net = searchParams.get('net') || 'main';
  if (['main', 'kovan'].indexOf(net) < 0) {
    throw new Error(`Invalid net param: ${net}`);
  }
  if (net === 'kovan') {
    console.log('Using kovan network');
  }
  return net as any;
}

function getAPIBase(ethNet: EthNet) {
  if (process.env.NODE_ENV === 'production') {
    return ethNet === 'kovan' ? 'https://beta-api.dexdex.io' : 'https://api.dexdex.io';
  } else {
    return 'http://localhost:8000';
  }
}

function getContractAddress(ethNet: EthNet) {
  const Contracts: Record<EthNet, string> = {
    kovan: '0x7cdb67d0bdad0244dc2580678dfc09d84f81d163',
    main: '0x0c577fbf29f8797d9d29a33de59001b872a1d4dc',
  };

  if (process.env.NODE_ENV === 'production') {
    return Contracts[ethNet];
  } else {
    return process.env.DEXDEX_CONTRACT!;
  }
}

export const widgetId: string = searchParams.get('widgetId')!;
export const EthereumNetwork: EthNet = readNet();
export const ApiBase: string = getAPIBase(EthereumNetwork);
export const ContractAddress: string = getContractAddress(EthereumNetwork);

const ETHERSCAN_URL =
  EthereumNetwork === 'kovan' ? 'https://kovan.etherscan.io' : 'https://etherscan.io';

export const etherscanAddressUrl = (address: Address) => `${ETHERSCAN_URL}/address/${address}`;
export const etherscanTxUrl = (txhash: string) => `${ETHERSCAN_URL}/tx/${txhash}`;
