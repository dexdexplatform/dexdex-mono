import { computePrice } from '@dexdex/model/lib/order';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { changeDecimals, DivMode } from '@dexdex/utils/lib/units';
import { BN } from 'bn.js';
import classnames from 'classnames';
import * as React from 'react';
import { etherscanAddressUrl, etherscanTxUrl } from '../config';

const classes = require('./Format.css');

const formatEth = (
  volumeEth: null | BN,
  decimals: number,
  defaultValue: string,
  mode: DivMode
): string => (volumeEth ? changeDecimals(volumeEth, 18, decimals, mode) : defaultValue);

const formatToken = (
  volume: null | BN,
  tokenDecimals: number,
  decimals: number,
  defaultValue: string,
  mode: DivMode
): string => (volume ? changeDecimals(volume, tokenDecimals, decimals, mode) : defaultValue);

export type BNFormatProps = {
  value: BN | null;
  displayDecimals?: number;
  defaultValue?: string;
  mode?: DivMode;
};
export type FormatEthProps = BNFormatProps;

export class FormatEth extends React.PureComponent<FormatEthProps> {
  render() {
    return formatEth(
      this.props.value,
      this.props.displayDecimals == null ? 6 : this.props.displayDecimals,
      this.props.defaultValue || '--',
      this.props.mode || DivMode.Round
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
      this.props.defaultValue || '--',
      this.props.mode || DivMode.Round
    );
  }
}

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

    return computePrice(volumeEth, volume, token.decimals).toFixed(displayDecimals);
  }
}

export type FormatPriceComparisonProps = {
  volume: BN;
  volumeEth: BN;
  effectiveVolume: BN;
  effectiveVolumeEth: BN;
  token: Tradeable;
  displayDecimals?: number;
  defaultValue?: string;
};

export class FormatPriceComparison extends React.PureComponent<FormatPriceComparisonProps> {
  render() {
    const { volume, volumeEth, effectiveVolume, effectiveVolumeEth, token } = this.props;
    const defaultValue = this.props.defaultValue || '--';
    const displayDecimals = this.props.displayDecimals == null ? 6 : this.props.displayDecimals;

    if (volume == null || volumeEth == null || volumeEth.isZero() || effectiveVolumeEth.isZero()) {
      return defaultValue;
    }

    const expectedPrice = computePrice(volumeEth, volume, token.decimals);
    const effectivePrice = computePrice(effectiveVolumeEth, effectiveVolume, token.decimals);

    const deltaPercentage = (1 - effectivePrice / expectedPrice) * 100;
    return <span>{deltaPercentage.toFixed(displayDecimals)} %</span>;
  }
}

const shortenAddress = (address: string, initial: number, final: number) => {
  const prefix = address.slice(0, initial);
  const suffix = address.slice(address.length - final);
  return `${prefix}..${suffix}`;
};

const externalIcon = require('./icons/external-link.svg');

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
        <a
          className={classnames(classes.addressLink, this.props.className)}
          href={etherscanAddressUrl(address)}
          target="_blank"
        >
          <span>{shortenAddress(address, 6, 6)}</span>
          <img src={externalIcon} />
        </a>
      );
    }
  }
}
export type FormatTxHashProps = {
  value: string;
  className?: string;
};

export class FormatTxHash extends React.PureComponent<FormatTxHashProps> {
  render() {
    const txhash = this.props.value;
    return (
      <a
        className={classnames(classes.txhashLink, this.props.className)}
        href={etherscanTxUrl(txhash)}
        target="_blank"
      >
        <span>{shortenAddress(txhash, 6, 6)}</span>
        <img src={externalIcon} />
      </a>
    );
  }
}
