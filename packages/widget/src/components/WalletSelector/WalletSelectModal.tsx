import { Token } from '@dexdex/model/lib/token';
import * as classnames from 'classnames/bind';
import * as React from 'react';
import { appConfig } from '../../config';
import { WalletId, WalletInfo } from '../../model/wallets/base';
import { getLedgerState, LedgerState, LedgetStatus } from '../../model/wallets/ledger';
import { getMetamaskState, MetaMaskState } from '../../model/wallets/metamask';
import { Wallet } from '../../model/widget-state';
import { FormatAddress, FormatEth, FormatToken } from '../Format';
import { Modal } from '../Modal';

const classes = require('./WalletSelector.css');
const cx = classnames.bind(classes);

export interface WalletSelectModalProps {
  currentToken: Token;
  onCancel: () => void;
  onChange: (selected: Wallet) => void;
}

export type WalletBoxProps = {
  id: WalletId;
  onClick?: () => void;
  disabled?: boolean;
};

const WalletBox: React.SFC<WalletBoxProps> = ({ id, disabled, onClick, children }) => (
  <div className={cx('walletBox', disabled && 'disabled')} onClick={onClick}>
    <div className={cx('walletBoxLeft')}>
      <img src={WalletInfo[id].icon} />
      <div>{WalletInfo[id].label} </div>
    </div>
    <div className={cx('walletBoxRight')}>{children}</div>
  </div>
);

const MetaMaskBox: React.SFC<{ state: MetaMaskState; token: Token; onClick: () => void }> = ({
  state,
  token,
  onClick,
}) => {
  if (state.status !== 'ok') {
    const Messages = {
      uninstalled: 'Metamask is not installed',
      networkInvalid: `Invalid network. Please use ${appConfig().network}`,
    };
    return (
      <WalletBox id={WalletId.MetaMask} disabled>
        <div>{Messages[state.status]}</div>
      </WalletBox>
    );
  }

  return (
    <WalletBox id={WalletId.MetaMask} onClick={onClick}>
      <div>
        <FormatEth value={state.state.balance} /> ETH
      </div>
      <div>
        <FormatToken value={state.state.tokenBalance} token={token} /> {token.symbol}
      </div>
      <FormatAddress className={cx('accountAddress')} value={state.state.address} noLink />
    </WalletBox>
  );
};

export interface WalletSelectModalState {
  metamask: MetaMaskState;
  ledger: LedgerState;
  ledgerConnectOp: 'idle' | 'connecting' | 'failed';
  page: 'home' | 'ledgerConnect' | 'ledgerChooseAccount';
}

export class WalletSelectModal extends React.Component<
  WalletSelectModalProps,
  WalletSelectModalState
> {
  state: WalletSelectModalState = {
    ledger: { status: LedgetStatus.NotConnected },
    ledgerConnectOp: 'idle',
    metamask: { status: 'uninstalled' },
    page: 'home',
  };

  async componentDidMount() {
    const metamaskState = await getMetamaskState(this.props.currentToken);
    this.setState({ metamask: metamaskState });
  }

  connectLedgerNano = async () => {
    this.setState({ ledgerConnectOp: 'connecting', ledger: { status: LedgetStatus.NotConnected } });
    const ledgerState = await getLedgerState(this.props.currentToken);
    if (ledgerState.status === LedgetStatus.Ok) {
      this.setState({ ledger: ledgerState, ledgerConnectOp: 'idle', page: 'ledgerChooseAccount' });
    } else {
      this.setState({ ledger: ledgerState, ledgerConnectOp: 'failed' });
    }
  };

  selectMetamask = () => {
    if (this.state.metamask.status === 'ok') {
      this.props.onChange({
        id: WalletId.MetaMask,
        address: this.state.metamask.state.address,
        eth: this.state.metamask.eth,
        networkId: appConfig().networkId,
      });
    }
  };

  selectLedger = (idx: number) => {
    if (this.state.ledger.status === LedgetStatus.Ok) {
      this.props.onChange({
        id: WalletId.Ledger,
        address: this.state.ledger.accounts[idx].address,
        eth: this.state.ledger.eth,
        networkId: appConfig().networkId,
      });
    }
  };

  goToLedgerConfig = () => {
    this.setState({ page: 'ledgerConnect' });
  };

  render() {
    switch (this.state.page) {
      case 'home':
        return this.renderHome();
      case 'ledgerConnect':
        return this.renderLedgerConnect();
      case 'ledgerChooseAccount':
        return this.renderLedgerChooseAccount();
      default:
        throw new Error('invalid page: ' + this.state.page);
    }
  }

  renderLedgerConnect() {
    return (
      <Modal modalClassName={cx('modal')} onClose={this.props.onCancel}>
        <div>
          <div>
            <ul>
              <li>Connect ledger nano & enter passcode</li>
              <li>Open Ethereum App</li>
              <li>Make sure you browser is enabled in settings</li>
            </ul>
          </div>
          <button onClick={this.connectLedgerNano}>Connect!</button>
          {this.state.ledgerConnectOp === 'connecting' && <div>Connecting...</div>}
          {this.state.ledgerConnectOp === 'failed' && (
            <div>Couldn't connect: {this.state.ledger.status}</div>
          )}
        </div>
      </Modal>
    );
  }
  renderLedgerChooseAccount() {
    if (this.state.ledger.status !== LedgetStatus.Ok) {
      throw new Error('invalid state');
    }
    const accountStates = this.state.ledger.accounts;
    const { currentToken } = this.props;
    return (
      <Modal modalClassName={cx('modal')} onClose={this.props.onCancel}>
        <div>
          Choose an account:
          <div>
            {accountStates.map((accountState, idx) => (
              <div key={idx} className={cx('ledgerAccount')} onClick={() => this.selectLedger(idx)}>
                <div>
                  <FormatAddress value={accountState.address} noLink />
                </div>
                <div>
                  <div>
                    <FormatEth value={accountState.balance} /> ETH
                  </div>
                  <div>
                    <FormatToken value={accountState.tokenBalance} token={currentToken} />{' '}
                    {currentToken.symbol}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  renderHome() {
    return (
      <Modal modalClassName={cx('modal')} onClose={this.props.onCancel}>
        <div>
          <MetaMaskBox
            state={this.state.metamask}
            token={this.props.currentToken}
            onClick={this.selectMetamask}
          />
          <WalletBox id={WalletId.Ledger} onClick={this.goToLedgerConfig}>
            Connect your ledger nano
          </WalletBox>
          <WalletBox id={WalletId.Trezor} disabled>
            Comming soon...
          </WalletBox>
        </div>
      </Modal>
    );
  }
}