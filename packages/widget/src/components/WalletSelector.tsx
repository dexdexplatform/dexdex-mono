import { Tradeable } from '@dexdex/model/lib/tradeable';
import * as React from 'react';
import Select, { Option } from 'react-select';
import 'react-select/dist/react-select.css';
import {
  AccountState,
  WalletAccountRef,
  WalletErrorState,
  WalletState,
  WalletInfo,
  WalletReadyState,
} from '../model/wallets/index';
import { FormatAddress, FormatEth, FormatToken } from './Format';
import { FormField } from './FormField';
import { ErrorMessage } from '../model/form-error';
import { isMobile } from '../config';

export interface WalletSelectorProps {
  wallets: WalletState[];
  selectedWallet: WalletAccountRef | null;
  tradeable: Tradeable;
  error?: ErrorMessage | null;
  onChange: (selected: WalletAccountRef | null) => void;
}

interface AccountOption extends Option<string> {
  kind: 'account';
  wallet: WalletReadyState;
  account: AccountState;
  accountIdx: number;
}
interface WalletOption extends Option<string> {
  kind: 'wallet';
  wallet: WalletErrorState;
  disabled: true;
}

type SelectorOption = WalletOption | AccountOption;

class WalletSelector extends React.Component<WalletSelectorProps> {
  render() {
    const { wallets, selectedWallet } = this.props;

    const selectedValue = selectedWallet
      ? `account-${selectedWallet.wallet}-${selectedWallet.accountIdx}`
      : undefined;

    if (wallets.length === 0) {
      return (
        <FormField label="Wallet" htmlFor="account" error={this.props.error}>
          <div>
            <span>You don't have a connected wallet</span>
          </div>
        </FormField>
      );
    }

    return (
      <FormField label="Wallet" htmlFor="account" error={this.props.error}>
        {isMobile ? (
          <div className="wallet-single-container">{this.optionRenderer(this.entryList()[0])}</div>
        ) : (
          <Select
            className="col"
            name="account"
            clearable={false}
            searchable={false}
            optionRenderer={this.optionRenderer}
            valueRenderer={this.optionRenderer}
            value={selectedValue}
            onChange={this.onChange}
            options={this.entryList()}
          />
        )}
      </FormField>
    );
  }

  private optionRenderer = (option: SelectorOption) => {
    const wallet = WalletInfo[option.wallet.walletId];
    return (
      <div className="flex-grid">
        <div className="wallet-name-container">
          <img className="wallet-symbol" src={wallet.icon} />
          <span className="wallet-name">{wallet.label} </span>
        </div>
        {option.kind === 'account' ? (
          <div className="wallet-info">
            <div className="wallet-amount-value">
              <FormatEth value={option.account.balance} /> ETH
            </div>
            <div className="wallet-amount-value">
              <FormatToken value={option.account.tokenBalance} token={this.props.tradeable} />{' '}
              {this.props.tradeable.symbol}
            </div>

            <FormatAddress className="wallet-address" value={option.account.address} noLink />
          </div>
        ) : (
          <div>{option.wallet.reason}</div>
        )}
      </div>
    );
  };

  private entryList(): SelectorOption[] {
    return this.props.wallets
      .map(walletState => {
        if (walletState.status === 'error') {
          return [
            {
              value: `wallet-${walletState.walletId}`,
              kind: 'wallet',
              wallet: walletState,
              disabled: true,
            } as WalletOption,
          ];
        } else {
          return walletState.accounts.map(
            (account, i) =>
              ({
                value: `account-${walletState.walletId}-${i}`,
                kind: 'account',
                wallet: walletState,
                account,
                accountIdx: i,
              } as AccountOption)
          );
        }
      })
      .reduce((acc: SelectorOption[], xs) => acc.concat(xs), []);
  }

  private onChange = (selected: AccountOption) => {
    this.props.onChange({ wallet: selected.wallet.walletId, accountIdx: selected.accountIdx });
  };
}

export default WalletSelector;
