import * as React from 'react';
import { BN } from 'bn.js';
import { fromWei } from 'ethjs-unit';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { fromTokenDecimals, getDecimalBase } from '@dexdex/utils/lib/units';
import { etherscanAddressUrl, etherscanTxUrl } from '../config';

const formatEth = (volumeEth: null | BN, decimals: number, defaultValue: string): string =>
  volumeEth ? Number(fromWei(volumeEth, 'ether')).toFixed(decimals) : defaultValue;

const formatToken = (
  volume: null | BN,
  tokenDecimals: number,
  decimals: number,
  defaultValue: string
): string =>
  volume ? Number(fromTokenDecimals(volume, tokenDecimals)).toFixed(decimals) : defaultValue;

export type BNFormatProps = {
  value: BN | null;
  displayDecimals?: number;
  defaultValue?: string;
};
export type FormatEthProps = BNFormatProps;

export class FormatEth extends React.PureComponent<FormatEthProps> {
  render() {
    return formatEth(
      this.props.value,
      this.props.displayDecimals == null ? 6 : this.props.displayDecimals,
      this.props.defaultValue || '--'
    );
  }
}

export type FormatTokenProps =
  | BNFormatProps & { token: Tradeable }
  | BNFormatProps & { decimals: number };

export class FormatToken extends React.PureComponent<FormatTokenProps> {
  render() {
    const decimals = 'token' in this.props ? this.props.token.decimals : this.props.decimals;
    const displayDecimals = Math.min(
      decimals,
      this.props.displayDecimals == null ? 6 : this.props.displayDecimals
    );
    return formatToken(
      this.props.value,
      decimals,
      displayDecimals,
      this.props.defaultValue || '--'
    );
  }
}

const ETHBASE = new BN('1000000000000000000'); // 18 decimals
const DECIMAL_PLACES = 100000000; // 8 decimal places

const price = (volume: BN, volumeEth: BN, token: Tradeable) => {
  // To get ETH, we move from token base to Eth base (token decimals -> 18 decimals)
  // since we want our result in ETH.

  // volume = X * 10^{tokendecimals}
  // volume in eth = X * 10^{tokendecimals} * 10^18 / 10^{tokendecimals}
  let volumeInEthBase = volume.mul(ETHBASE).div(getDecimalBase(token.decimals));

  // since BN doesn't have decimal, we add some 0s and later we remove them
  let res = volumeEth.mul(new BN(DECIMAL_PLACES));

  // get the price, it will be: price_in_eth * 10^8 (decimal places)
  res = res.div(volumeInEthBase);

  // convert to number & divide to get correct decimals
  return res.toNumber() / DECIMAL_PLACES;
};

export type FormatPriceProps = {
  volume: BN | null;
  volumeEth: BN | null;
  token: Tradeable;
  displayDecimals?: number;
  defaultValue?: string;
};
export class FormatPrice extends React.PureComponent<FormatPriceProps> {
  render() {
    const { volume, volumeEth, token } = this.props;
    const defaultValue = this.props.defaultValue || '--';
    const displayDecimals = this.props.displayDecimals == null ? 6 : this.props.displayDecimals;

    if (volume == null || volumeEth == null || volumeEth.isZero()) {
      return defaultValue;
    }

    return price(volume, volumeEth, token).toFixed(displayDecimals);
  }
}

const shortenAddress = (address: string, initial: number, final: number) => {
  const prefix = address.slice(0, initial);
  const suffix = address.slice(address.length - final);
  return `${prefix}..${suffix}`;
};

export type FormatAddressProps = {
  value: string;
  className?: string;
  noLink?: boolean;
};

export class FormatAddress extends React.PureComponent<FormatAddressProps> {
  render() {
    const address = this.props.value;
    if (this.props.noLink) {
      return <span className={this.props.className}>{shortenAddress(address, 6, 6)}</span>;
    } else {
      return (
        <a className={this.props.className} href={etherscanAddressUrl(address)} target="_blank">
          {shortenAddress(address, 6, 6)}
        </a>
      );
    }
  }
}
export type FormatTxHashProps = {
  value: string;
  className: string;
};

export class FormatTxHash extends React.PureComponent<FormatTxHashProps> {
  render() {
    const txhash = this.props.value;
    return (
      <a className={this.props.className} href={etherscanTxUrl(txhash)} target="_blank">
        {shortenAddress(txhash, 6, 6)}
      </a>
    );
  }
}
