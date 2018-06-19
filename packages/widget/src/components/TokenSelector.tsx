import * as React from 'react';
import Select, { Option } from 'react-select';
import 'react-select/dist/react-select.css';
import { Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { tokenSmallImg } from '../config';

export interface TokenSelectorProps {
  operation: Operation;
  tokens: Tradeable[];
  selectedToken: Tradeable;
  onChange: (token: Tradeable) => void;
}

class TokenSelector extends React.PureComponent<TokenSelectorProps> {
  optionRenderer = (option: Option<number>) => {
    const token = this.props.tokens[option.value!];
    return (
      <div className="select-symbol-name">
        <img className="token-symbol" src={tokenSmallImg(token.symbol)} />
        <span className="token-name">
          {token.symbol} <small>({token.name})</small>
        </span>
      </div>
    );
  };

  render() {
    const { tokens, onChange, selectedToken } = this.props;

    return (
      <Select
        className="token-selector col"
        name="token"
        clearable={false}
        searchable={true}
        optionRenderer={this.optionRenderer}
        valueRenderer={this.optionRenderer}
        value={selectedToken ? tokens.indexOf(selectedToken) : -1}
        onChange={selected => {
          if (selected && !Array.isArray(selected)) {
            const idx = Number(selected.value);
            onChange(tokens[idx]);
          }
        }}
        options={tokens.map((token, idx) => ({
          value: idx,
          label: `${token.symbol} - ${token.name}`,
        }))}
      />
    );
  }
}

export default TokenSelector;
