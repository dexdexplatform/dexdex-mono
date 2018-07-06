import { Token } from '@dexdex/model/lib/token';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import 'react-select/dist/react-select.css';
import { tokenDefaultSmallImg, tokenSmallImg } from '../config';
import { SafeImage } from './ImageLoader';
import * as classnames from 'classnames/bind';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';

const cx = classnames.bind(require('./TokenSelector.css'));

const preventPropagation: React.EventHandler<any> = e => {
  e.stopPropagation();
};

// TokenImage
//------------------------------------------------------------------------------

export type TokenImageProps = {
  token: Token;
};
const TokenImage: React.SFC<TokenImageProps> = ({ token }) => (
  <SafeImage
    src={tokenSmallImg(token.address)}
    fallback={tokenDefaultSmallImg}
    className={cx('tokenSymbol')}
    alt={`${token.symbol}`}
  />
);

// TokenList (for Modal)
//------------------------------------------------------------------------------

interface TokenListProps {
  tokens: Token[];
  selectedToken: Token;
  setToken: (token: Token) => void;
}
class TokenList extends React.PureComponent<TokenListProps> {
  listRef: React.RefObject<List>;

  constructor(props: TokenListProps) {
    super(props);
    this.listRef = React.createRef();
  }

  chooseToken = (token: Token) => {
    this.props.setToken(token);
  };

  rowRenderer = ({ index, style, key }: ListRowProps) => {
    const token = this.props.tokens[index];

    return (
      <div
        key={key}
        style={style}
        className={cx('row', this.props.selectedToken === token && 'selected')}
        onClick={e => {
          e.stopPropagation();
          this.chooseToken(token);
        }}
      >
        <TokenImage token={token} />
        <span className={cx('name')}>
          {token.symbol} <small>{token.name}</small>
        </span>
      </div>
    );
  };

  componentDidUpdate() {
    if (this.listRef.current) {
      this.listRef.current.forceUpdate();
    }
  }

  render() {
    return (
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={this.listRef}
            height={height}
            width={width}
            // overscanRowCount={overscanRowCount}
            // noRowsRenderer={this._noRowsRenderer}
            rowCount={this.props.tokens.length}
            rowHeight={50}
            rowRenderer={this.rowRenderer}
            // scrollToIndex={scrollToIndex}
          />
        )}
      </AutoSizer>
    );
  }
}

// TokenSelection Mdoal
//------------------------------------------------------------------------------

export interface TokenSelectionModalProps {
  tokens: Token[];
  selectedToken: Token;
  setToken: (token: Token) => void;
  onCancel: () => void;
}

export interface TokenSelectionModalState {
  currentSearch: string;
}

class TokenSelectionModal extends React.PureComponent<
  TokenSelectionModalProps,
  TokenSelectionModalState
> {
  searchRef: React.RefObject<HTMLInputElement>;

  state: TokenSelectionModalState = {
    currentSearch: '',
  };

  constructor(props: TokenSelectionModalProps) {
    super(props);
    this.searchRef = React.createRef();
  }

  get filteredTokens() {
    const currentSearch = this.state.currentSearch.toLowerCase().trim();
    if (currentSearch.length === 0) {
      return this.props.tokens;
    } else {
      return this.props.tokens.filter(
        token =>
          token.name.toLowerCase().includes(currentSearch) ||
          token.symbol.toLowerCase().includes(currentSearch)
      );
    }
  }

  setSearchText: React.ChangeEventHandler<any> = e => {
    const value = e.currentTarget.value;
    this.setState({ currentSearch: value });
  };

  onSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      // ENTER pressed
      const tokens = this.filteredTokens;
      if (tokens.length === 1) {
        this.props.setToken(tokens[0]);
      }
    }
  };

  componentDidMount() {
    if (this.searchRef.current) {
      this.searchRef.current.focus();
    }
  }

  renderPortal() {
    return (
      <div
        className={cx('modalOverlay')}
        aria-hidden={false}
        onClick={this.props.onCancel}
        role="dialog"
        tabIndex={-1}
      >
        <div className={cx('modal')} onClick={preventPropagation}>
          <div className={cx('headerModal')}>
            <div className={cx('headerTitle')}>Token List</div>
            <div className={cx('closeModal')} onClick={this.props.onCancel}>
              ✕
            </div>
          </div>
          <div className={cx('modalSearchArea')}>
            <input
              placeholder="search..."
              ref={this.searchRef}
              type="text"
              value={this.state.currentSearch}
              onChange={this.setSearchText}
              onKeyUp={this.onSearchKeyUp}
            />
          </div>
          <div className={cx('modalTokenList')}>
            <TokenList
              tokens={this.filteredTokens}
              selectedToken={this.props.selectedToken}
              setToken={this.props.setToken}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return ReactDOM.createPortal(this.renderPortal(), document.getElementById('modal-root')!);
  }
}

// TokenSelector
//------------------------------------------------------------------------------

export interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token;
  onChange: (token: Token) => void;
}

export interface TokenSelectorState {
  isOpen: boolean;
}

class TokenSelector extends React.PureComponent<TokenSelectorProps, TokenSelectorState> {
  state: TokenSelectorState = {
    isOpen: false,
  };

  openSelector: React.MouseEventHandler<HTMLElement> = e => {
    e.stopPropagation();
    this.setState({ isOpen: true });
  };

  cancelSelection = () => {
    this.setState({ isOpen: false });
  };

  setToken = (t: Token) => {
    this.setState({ isOpen: false });
    this.props.onChange(t);
  };

  render() {
    const { selectedToken } = this.props;

    return (
      <div className={cx('tokenSelector')} onClick={this.openSelector}>
        <TokenImage token={selectedToken} />
        <span className={cx('name')}>
          {selectedToken.symbol} <small>{selectedToken.name}</small>
        </span>
        {this.state.isOpen && (
          <TokenSelectionModal
            tokens={this.props.tokens}
            selectedToken={this.props.selectedToken}
            setToken={this.setToken}
            onCancel={this.cancelSelection}
          />
        )}
      </div>
    );
  }
}

export default TokenSelector;
