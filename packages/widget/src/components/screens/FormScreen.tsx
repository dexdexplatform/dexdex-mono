import { Operation } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import { fixDecimals } from '@dexdex/utils/lib/format';
import BN from 'bn.js';
import * as React from 'react';
import { RenderMapper } from '.';
import { ErrorMessage } from '../../model/form-error';
import { GasPrice } from '../../model/widget';
import { Operations, WidgetState, WalletDetails, Wallet } from '../../model/widget-state';
import * as actions from '../../model/widget-state/actions';
import {
  expectedVolume,
  expectedVolumeEth,
  getAmountError,
  networkCost,
  getBalanceError,
} from '../../model/widget-state/selectors';
import AmountField from '../AmountField';
import { FormatEth, FormatPrice } from '../Format';
import { FormField } from '../FormField';
import OperationSelector from '../OperationSelector';
import TokenSelector from '../TokenSelector';
import WalletSelector from '../WalletSelector';
import { Screen } from '../Screen';

const classes = require('./FormScreen.css');
const DEXDEX_ICON = require('../icons/dexdex.svg');

export interface WidgetFormProps {
  actions: Operations;
  tokenList: Token[];
  token: Token;
  wallet: WalletDetails | null;
  amountError: null | ErrorMessage;
  balanceError: null | ErrorMessage;
  canSubmit: boolean;
  amount: string; // expressed in Tokens #
  gasPrice: GasPrice;
  operation: Operation;
  enabledOperations: Operation[];
  expectedVolume: BN | null;
  expectedVolumeEth: BN | null;
  networkCost: BN | null;
}

export const mapper: RenderMapper<WidgetFormProps> = store => {
  const setToken = (x: Token) => store.dispatch(actions.setToken(x));
  const setOperation = (x: Operation) => store.dispatch(actions.setOperation(x));
  const setWallet = (x: Wallet) => store.dispatch(actions.setWallet(x));
  const startTransaction = () => store.dispatch(actions.startTransaction());

  const setAmount = (ws: WidgetState) => (x: string) => {
    const fixed = fixDecimals(x, ws.token.decimals);
    if (ws.amount !== fixed) {
      store.dispatch(actions.setAmount(fixed));
    }
  };

  return ws => {
    const amountError = getAmountError(ws);
    const balanceError = getBalanceError(ws);
    return {
      tokenList: ws.config.tokens,
      token: ws.token,
      wallet: ws.wallet,
      amountError,
      balanceError,
      canSubmit:
        amountError == null && balanceError == null && ws.wallet != null && ws.orderbook != null,
      amount: ws.amount,
      gasPrice: ws.gasPrice,
      enabledOperations: ws.config.enabledOperations,
      operation: ws.operation,
      expectedVolume: amountError == null ? expectedVolume(ws) : null,
      expectedVolumeEth: expectedVolumeEth(ws),
      networkCost: networkCost(ws),
      actions: {
        setAmount: setAmount(ws),
        setToken,
        setOperation,
        setWallet,
        startTransaction,
      },
    };
  };
};

const WidgetForm: React.SFC<WidgetFormProps> = props => (
  <Screen kind="form">
    <OperationSelector
      enabledOperations={props.enabledOperations}
      value={props.operation}
      onChange={props.actions.setOperation}
    />
    <FormField label={`${props.operation} Amount`} htmlFor="token" error={props.amountError}>
      <div className={classes.flexWrapper}>
        <AmountField amount={props.amount} onChange={props.actions.setAmount} />
        <TokenSelector
          tokens={props.tokenList}
          selectedToken={props.token}
          onChange={props.actions.setToken}
        />
      </div>
    </FormField>
    <WalletSelector
      wallet={props.wallet}
      token={props.token}
      error={props.balanceError}
      onChange={props.actions.setWallet}
    />
    <div className={classes.summary}>
      <div className={classes.summaryItem}>
        <label>Price</label>
        <div>
          <FormatPrice
            volume={props.expectedVolume}
            volumeEth={props.expectedVolumeEth}
            token={props.token}
          />{' '}
          ETH / {props.token.symbol}
        </div>
      </div>
      <div className={`${classes.summaryItem} ${classes.total}`}>
        <label>{props.operation === 'buy' ? 'You will exchange' : 'You will receive'}</label>
        <div>
          <FormatEth value={props.expectedVolumeEth} /> ETH
        </div>
      </div>
    </div>
    <button
      className={classes.btnSubmit}
      disabled={!props.canSubmit}
      onClick={props.actions.startTransaction}
    >
      Confirm
    </button>
    <div className={classes.footer}>
      <div>
        <span>Powered by </span>
        <a href="https://dexdex.io/" target="_blank">
          <img src={DEXDEX_ICON} alt="DEXDEX" />
        </a>
      </div>
      <div>
        By clicking confirm, you agree to our{' '}
        <a href="https://dexdex.io/tos/" target="_blank">
          terms
        </a>
      </div>
    </div>
  </Screen>
);

export { WidgetForm as Screen };
