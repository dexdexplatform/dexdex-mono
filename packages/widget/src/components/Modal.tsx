import * as React from 'react';
import { Portal } from './Portal';
import * as classnames from 'classnames/bind';
const cx = classnames.bind(require('./Modal.css'));

const preventPropagation: React.EventHandler<any> = e => {
  e.stopPropagation();
};

export type ModalProps = {
  onClose: () => void;
  modalClassName?: string;
};

export class Modal extends React.PureComponent<ModalProps> {
  searchRef: React.RefObject<HTMLInputElement>;

  onKeyPress = (e: KeyboardEvent) => {
    if (e.keyCode === 27 && this.props.onClose) {
      // ESC pressed
      this.props.onClose();
    }
  };

  closeModal: React.MouseEventHandler<any> = e => {
    e.stopPropagation();
    if (this.props.onClose) {
      this.props.onClose();
    }
  };
  componentDidMount() {
    window.addEventListener('keydown', this.onKeyPress);
  }

  componentWillMount() {
    window.removeEventListener('keydown', this.onKeyPress);
  }

  render() {
    return (
      <Portal>
        <div
          className={cx('modalOverlay')}
          aria-hidden={false}
          onClick={this.closeModal}
          role="dialog"
          tabIndex={-1}
        >
          <div className={cx('modal', this.props.modalClassName)} onClick={preventPropagation}>
            {this.props.children}
          </div>
        </div>
      </Portal>
    );
  }
}
