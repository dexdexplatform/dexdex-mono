import * as React from 'react';
import Select, { Option } from 'react-select';
import 'react-select/dist/react-select.css';
import { toEther } from '@dexdex/utils/lib/units';
import { Wallet } from '../model/wallets';
import { WalletDetails } from '../model/widget-state';

export interface WalletSelectorProps {
  wallets: Wallet[];
  walletDetails: WalletDetails | null;
  selectedWallet: Wallet | null;
  onChange: (selected: Wallet | null) => void;
}

class WalletSelector extends React.Component<WalletSelectorProps> {
  valueRenderer = (option: Option<number>) => {
    const wallet = this.props.wallets[option.value!];
    return (
      <div className="col select-symbol-name">
        <span className="wallet-name">{wallet.name} </span>
        <img className="wallet-symbol" src={wallet.icon} />
      </div>
    );
  };

  optionRenderer = (option: Option<number>) => {
    const wallet = this.props.wallets[option.value!];
    return (
      <div className="col select-symbol-name">
        <span className="wallet-name">{wallet.name} </span>
        <img className="wallet-symbol" src={wallet.icon} />
      </div>
    );
  };

  render() {
    const { wallets, walletDetails, selectedWallet, onChange } = this.props;

    return (
      <div className="margin-bottom">
        <label className="FormControl_Label flex-grid" htmlFor="wallet">
          Wallet
        </label>
        {wallets.length === 0 ? (
          <div className="select-symbol-name">
            <span className="wallet-name">You don't have a connected wallet</span>
          </div>
        ) : (
          <div className="wallet-selector-wrapper flex-grid">
            <Select
              className="col"
              name="wallet"
              clearable={false}
              searchable={false}
              optionRenderer={this.optionRenderer}
              valueRenderer={this.valueRenderer}
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
            <div className="wallet-info">
              {walletDetails && (
                <>
                  <p className="wallet-amount">
                    You have{' '}
                    <span className="wallet-amount-value">
                      {toEther(walletDetails.etherBalance)} ethers
                    </span>
                  </p>
                  <p className="wallet-id">{walletDetails.address}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default WalletSelector;
