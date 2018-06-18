import * as React from 'react';
import Select, { Option } from 'react-select';
import 'react-select/dist/react-select.css';
import { Wallet } from '../model/wallets';
import { WalletDetails } from '../model/widget-state';
import { FormatEth, FormatToken, FormatAddress } from './Format';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { FormField } from './FormField';

export interface WalletSelectorProps {
  wallets: Wallet[];
  walletDetails: WalletDetails | null;
  selectedWallet: Wallet | null;
  tradeable: Tradeable;
  onChange: (selected: Wallet | null) => void;
}

class WalletSelector extends React.Component<WalletSelectorProps> {
  optionRenderer = (option: Option<number>) => {
    const wallet = this.props.wallets[option.value!];
    return (
      <div className="flex-grid">
        <div className="col select-symbol-name">
          <img className="wallet-symbol" src={wallet.icon} />
          <span className="wallet-name">{wallet.name} </span>
        </div>
        <div className="wallet-info">
          {this.props.walletDetails && (
            <>
              <div className="wallet-amount-value">
                <FormatEth value={this.props.walletDetails.etherBalance} /> ETH
              </div>
              <div className="wallet-amount-value">
                <FormatToken
                  value={this.props.walletDetails.tradeableBalance}
                  token={this.props.tradeable}
                />{' '}
                {this.props.tradeable.symbol}
              </div>
              {this.props.walletDetails.address && (
                <FormatAddress value={this.props.walletDetails.address} noLink />
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { wallets, selectedWallet, onChange } = this.props;

    return (
      <FormField label="Wallet" htmlFor="wallet">
        {wallets.length === 0 ? (
          <div className="select-symbol-name">
            <span>You don't have a connected wallet</span>
          </div>
        ) : (
          <Select
            className="col"
            name="wallet"
            clearable={false}
            searchable={false}
            optionRenderer={this.optionRenderer}
            valueRenderer={this.optionRenderer}
            value={selectedWallet ? wallets.indexOf(selectedWallet) : -1}
            onChange={selected => {
              if (selected && !Array.isArray(selected)) {
                const idx = Number(selected.value);
                onChange(wallets[idx]);
              } else {
                onChange(null);
              }
            }}
            options={wallets.map((w, idx) => ({
              value: idx,
              label: w.name,
            }))}
          />
        )}
      </FormField>
    );
  }
}

export default WalletSelector;
