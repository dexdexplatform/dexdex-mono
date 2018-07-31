import * as React from 'react';
import { Modal } from './Modal';
import { isEmbed } from '../config';

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

class NoWalletModal extends React.PureComponent<NoWalletModalProps> {
  render() {
    return (
      <Modal onClose={this.props.closeModal}>
        <div>No tenes wallet loco! Media pila</div>
        <div>
          Usa{' '}
          <a target="_top" href={TrustURL}>
            TRUST!
          </a>
        </div>
        <div>
          Y sino te gusta, usa{' '}
          <a target="_top" href="https://get.status.im/browse/easytrade.io">
            Status
          </a>
        </div>
      </Modal>
    );
  }
}

export default NoWalletModal;
