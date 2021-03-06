import * as React from 'react';

const classes = require('./AmountField.css');

export interface AmountFieldProps {
  amount: string;
  onChange: (newAmount: string) => void;
}

class AmountField extends React.Component<AmountFieldProps> {
  inputChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const valueStr = e.target.value;
    try {
      if (Number(valueStr) >= 0) {
        this.props.onChange(valueStr);
      }
    } catch (err) {
      console.log('error:', err);
    }
  };

  render() {
    const { amount } = this.props;
    return (
      <input
        className={classes.amountField}
        id="amount"
        type="number"
        value={amount}
        onChange={this.inputChange}
      />
    );
  }
}

export default AmountField;
