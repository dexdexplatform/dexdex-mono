import { Token } from '@dexdex/model/lib/token';
import * as classnames from 'classnames/bind';
import * as React from 'react';
import { isMobile } from '../../config';
import { ErrorMessage } from '../../model/form-error';
import { WalletInfo } from '../../model/wallets/base';
import { Wallet, WalletDetails } from '../../model/widget-state';
import { FormatAddress, FormatEth, FormatToken } from '../Format';
import { FormField } from '../FormField';
import { WalletSelectModal } from './WalletSelectModal';

const classes = require('./WalletSelector.css');
const cx = classnames.bind(classes);

export interface WalletSelectorProps {
  wallet: WalletDetails | null;
  token: Token;
  error?: ErrorMessage | null;
  onChange: (selected: Wallet) => void;
}

export interface WalletSelectorState {
  modalOpen: boolean;
}

class WalletSelector extends React.Component<WalletSelectorProps, WalletSelectorState> {
  state: WalletSelectorState = {
    modalOpen: false,
  };

  openModal = () => this.setState({ modalOpen: true });
  closeModal = () => this.setState({ modalOpen: false });

  onSelect = (wallet: Wallet) => {
    this.closeModal();
    this.props.onChange(wallet);
  };

  render() {
    const { wallet, token } = this.props;

    return (
      <>
        <FormField label="Wallet" htmlFor="account" error={this.props.error}>
          <div
            className={cx('walletSelector', isMobile && 'mobile')}
            onClick={isMobile ? undefined : this.openModal}
          >
            {wallet === null ? (
              <div>
                <span>You don’t have a wallet connected</span>
              </div>
            ) : (
              <>
                <div className={classes.nameContainer}>
                  <img className={classes.icon} src={WalletInfo[wallet.id].icon} />
                  <span className={classes.name}>{WalletInfo[wallet.id].label} </span>
                </div>

                <div className={classes.info}>
                  <div className={classes.balance}>
                    <FormatEth value={wallet.balance} /> ETH
                  </div>
                  <div className={classes.balance}>
                    <FormatToken value={wallet.tokenBalance} token={token} /> {token.symbol}
                  </div>

                  <FormatAddress className={classes.address} value={wallet.address} noLink />
                </div>
                <span className={cx('caret')}>▾</span>
              </>
            )}
          </div>
        </FormField>
        {this.state.modalOpen && (
          <WalletSelectModal
            onCancel={this.closeModal}
            onChange={this.onSelect}
            currentToken={token}
          />
        )}
      </>
    );
  }
}

export default WalletSelector;
