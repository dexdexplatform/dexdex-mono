import { Address } from '@dexdex/model/lib/base';

export type EthNet = 'main' | 'kovan';

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

function readConfig() {
  const searchParams = new URLSearchParams(window.location.hash.slice(1));
  // parent window, search for div
  const div = document.getElementById('dexdex-root');
  if (div === null) {
    console.error('<div id="dexdex-root"> is missing>');
    throw new Error('Bad Config');
  }

  const net =
    (searchParams.get('net') as EthNet) || (div.getAttribute('data-net') as EthNet) || 'main';
  if (['main', 'kovan'].indexOf(net) < 0) {
    throw new Error(`Invalid net param: ${net}`);
  }
  if (net === 'kovan') {
    console.log('Using kovan network');
  }

  const widgetId = searchParams.get('widgetId') || div.getAttribute('data-dexdex-is');
  if (widgetId == null) {
    console.error('Missing widgetId (url param widgetId or data-dexdex-id attr');
    throw new Error('Bad Config');
  }

  return {
    widgetId,
    network: net,
    ApiBase: getAPIBase(net),
    ContractAddress: getContractAddress(net),
    EtherscanUrl: net === 'kovan' ? 'https://kovan.etherscan.io' : 'https://etherscan.io',
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

export const appConfig = once(readConfig);

export const etherscanAddressUrl = (address: Address) =>
  `${appConfig().EtherscanUrl}/address/${address}`;
export const etherscanTxUrl = (txhash: string) => `${appConfig().EtherscanUrl}/tx/${txhash}`;

function computeIsMobile() {
  const ua = window.navigator.userAgent;
  return ua.includes('iPhone') || ua.includes('Android');
}

export const isMobile = computeIsMobile();

export const tokenSmallImg = (symbol: string) =>
  `https://firebasestorage.googleapis.com/v0/b/easytrade-00001.appspot.com/o/` +
  encodeURIComponent(`tokens/${23}/${symbol.toLowerCase()}.png`) +
  '?alt=media';

export const tokenBigImg = (symbol: string) =>
  `https://firebasestorage.googleapis.com/v0/b/easytrade-00001.appspot.com/o/` +
  encodeURIComponent(`tokens/${64}/${symbol.toLowerCase()}.png`) +
  '?alt=media';
