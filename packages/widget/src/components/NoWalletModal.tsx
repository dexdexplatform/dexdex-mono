import * as React from 'react';
import { Modal } from './Modal';
import { isEmbed } from '../config';

const classes = require('./NoWalletModal.css');

export interface NoWalletModalProps {
  closeModal: () => void;
}

function getCurrentUrl() {
  if (isEmbed) {
    return document.referrer;
  } else {
    return window.location.href;
  }
}

const TrustURL =
  'https://links.trustwalletapp.com/a/key_live_lfvIpVeI9TFWxPCqwU8rZnogFqhnzs4D' +
  `?&event=openURL&url=${encodeURIComponent(getCurrentUrl())}`;

const logoTrust = require('./images/logoTrust.png');
const logoToshi = require('./images/logoToshi.png');
const logoStatus = require('./images/logoStatus.png');

class NoWalletModal extends React.PureComponent<NoWalletModalProps> {
  render() {
    return (
      <Modal onClose={this.props.closeModal}>
        <div className={classes.header}>
          <h1>Wallet App Required</h1>
        </div>
        <div className={classes.content}>
          <p>To use EasyTrade you need to install a wallet app. We suggest the followings:</p>

          <div className={classes.links}>
            <a target="_top" href={TrustURL}>
              <img src={logoTrust} />
            </a>

            <a href="http://onelink.to/8yv352">
              <img src={logoToshi} />
            </a>

            <a target="_top" href="https://get.status.im/browse/easytrade.io">
              <img src={logoStatus} />
            </a>
          </div>
        </div>
      </Modal>
    );
  }
}

export default NoWalletModal;
