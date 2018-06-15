import * as React from 'react';
import { ErrorMessage } from '../model/form-error';
import { FormatError } from './FormatError';

export interface AmountFieldProps {
  error: null | ErrorMessage;
  amount: string;
  onChange: (newAmount: string) => void;
}

class AmountField extends React.Component<AmountFieldProps> {
  inputChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const valueStr = e.target.value;
    if (Number(valueStr) >= 0) {
      this.props.onChange(valueStr);
    }
  };

  render() {
    const { amount, error } = this.props;
    return (
      <div className="col">
        <input
          className="AmountField"
          id="amount"
          type="number"
          value={amount}
          onChange={this.inputChange}
        />
        <span>{error && <FormatError msg={error} />}</span>
      </div>
    );
  }
}

export default AmountField;
