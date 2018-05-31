import * as React from 'react';

export interface AmountFieldProps {
  error: boolean;
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
        <span>{error ? 'Invalid Amount' : ''}</span>
      </div>
    );
  }
}

export default AmountField;
