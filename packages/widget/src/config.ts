import { Address } from '@dexdex/model/lib/base';
import { EthNet } from './model/wallets/base';

const once = <A>(f: () => A) => {
  let called = false;
  let cache: A;
  return () => {
    if (!called) {
      cache = f();
      called = true;
    }
    return cache;
  };
};

// tells wether we are a iframe or not
export const isEmbed = window.parent !== window;

function computeIsMobile() {
  const ua = window.navigator.userAgent;
  return ua.includes('iPhone') || ua.includes('Android');
}

export const isMobile = computeIsMobile();

const configReader = () => {
  let getValue: (varname: string) => string | null;
  if (isEmbed) {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    getValue = varname => searchParams.get(varname);
  } else {
    const div = document.getElementById('dexdex-root');
    if (div === null) {
      console.error('<div id="dexdex-root"> is missing>');
      throw new Error('Bad Config');
    }
    getValue = (varname: string) => div.getAttribute(`data-${varname}`);
  }
  return getValue;
};

const withinChoices = (...choices: string[]) => (value: string) => choices.indexOf(value) >= 0;

const isValidNetwork = (net: string) => withinChoices('mainnet', 'kovan');
const isValidOperations = (operations: string) => withinChoices('buy', 'sell', 'both');

const areValidTokens = (tokens: string) =>
  /^0x[a-fA-F0-9]{40}(?:,0x[a-fA-F0-9]{40})*$/.test(tokens);

function ethNetToId(ethNet: EthNet): number {
  const EthNetIds = {
    mainnet: 1,
    morden: 2,
    ropsten: 3,
    rinkeby: 4,
    kovan: 42,
    devnet: 66,
  };
  return EthNetIds[ethNet];
}

function readConfig() {
  const getConfigParam = configReader();

  let network: EthNet;
  if (process.env.NODE_ENV === 'production') {
    network = (getConfigParam('net') as EthNet) || 'mainnet';
    if (!isValidNetwork(network)) {
      console.error('Bad "data-net" parameter, valid values: kovan,mainet');
      throw new Error('Bad Config');
    }
  } else {
    network = 'devnet';
  }

  const widgetId = getConfigParam('dexdex-id');
  if (widgetId == null) {
    console.error('Missing "data-dexdex-id" parameter');
    throw new Error('Bad Config');
  }

  const operations = getConfigParam('operations');
  if (operations != null && !isValidOperations(operations)) {
    console.error('Bad "data-operations" parameter, valid values: buy,sell,both');
    throw new Error('Bad Config');
  }

  const tokens = getConfigParam('tokens');
  if (tokens != null && !areValidTokens(tokens)) {
    console.error('Bad "data-tokens" parameter, must be tokenaddresses separated by ","');
    throw new Error('Bad Config');
  }

  return {
    widgetId,
    operations,
    tokens,
    network,
    networkId: ethNetToId(network),
    ApiBase: getAPIBase(network),
    ContractAddress: getContractAddress(network),
    EtherscanUrl: network === 'kovan' ? 'https://kovan.etherscan.io' : 'https://etherscan.io',
  };
}

function getAPIBase(ethNet: EthNet) {
  if (process.env.NODE_ENV === 'production') {
    return ethNet === 'kovan' ? 'https://beta-api.dexdex.io' : 'https://api.dexdex.io';
  } else {
    return 'http://localhost:8000';
  }
}

function getContractAddress(ethNet: EthNet) {
  const Contracts: Record<string, string> = {
    kovan: '0x7cdb67d0bdad0244dc2580678dfc09d84f81d163',
    mainnet: '0x0c577fbf29f8797d9d29a33de59001b872a1d4dc',
  };

  if (process.env.NODE_ENV === 'production') {
    return Contracts[ethNet];
  } else {
    return process.env.DEXDEX_CONTRACT!;
  }
}

export const appConfig = once(readConfig);

export const etherscanAddressUrl = (address: Address) =>
  `${appConfig().EtherscanUrl}/address/${address}`;
export const etherscanTxUrl = (txhash: string) => `${appConfig().EtherscanUrl}/tx/${txhash}`;

const tokenImage = (size: 23 | 32, name: string) =>
  `https://firebasestorage.googleapis.com/v0/b/easytrade-00001.appspot.com/o/` +
  encodeURIComponent(`tokens/${size}/${name}.png`) +
  '?alt=media';

export const tokenDefaultSmallImg = tokenImage(23, '_default');
export const tokenDefaultBigImg = tokenImage(32, '_default');
export const tokenSmallImg = (address: string) => tokenImage(23, address.toLowerCase());
export const tokenBigImg = (address: string) => tokenImage(32, address.toLowerCase());
