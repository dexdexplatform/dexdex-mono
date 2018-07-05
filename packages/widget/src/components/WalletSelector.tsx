import { Token } from '@dexdex/model/lib/token';
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

const classes = require('./WalletSelector.css');

export interface WalletSelectorProps {
  wallets: WalletState[];
  selectedWallet: WalletAccountRef | null;
  token: Token;
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
          <div className={classes.singleContainer}>{this.optionRenderer(this.entryList()[0])}</div>
        ) : (
          <Select
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
      <div className={classes.walletSelector}>
        <div className={classes.nameContainer}>
          <img className={classes.icon} src={wallet.icon} />
          <span className={classes.name}>{wallet.label} </span>
        </div>
        {option.kind === 'account' ? (
          <div className={classes.info}>
            <div className={classes.balance}>
              <FormatEth value={option.account.balance} /> ETH
            </div>
            <div className={classes.balance}>
              <FormatToken value={option.account.tokenBalance} token={this.props.token} />{' '}
              {this.props.token.symbol}
            </div>

            <FormatAddress className={classes.address} value={option.account.address} noLink />
          </div>
        ) : (
          <div className={classes.walletReason}>{option.wallet.reason}</div>
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
