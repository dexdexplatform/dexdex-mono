import { Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { fixDecimals } from '@dexdex/utils/lib/format';
import { BN } from 'bn.js';
import * as React from 'react';
import { RenderMapper } from '.';
import { ErrorMessage } from '../../model/form-error';
import { WalletAccountRef, WalletState } from '../../model/wallets/index';
import { GasPrice } from '../../model/widget';
import { Operations, WidgetState } from '../../model/widget-state';
import * as actions from '../../model/widget-state/actions';
import {
  expectedVolume,
  expectedVolumeEth,
  getAmountError,
  getWalletList,
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
  tradeableList: Tradeable[];
  tradeable: Tradeable;
  walletList: WalletState[];
  wallet: WalletAccountRef | null;
  amountError: null | ErrorMessage;
  balanceError: null | ErrorMessage;
  canSubmit: boolean;
  amount: string; // expressed in Tokens #
  gasPrice: GasPrice;
  operation: Operation;
  expectedVolume: BN | null;
  expectedVolumeEth: BN | null;
  networkCost: BN | null;
}

export const mapper: RenderMapper<WidgetFormProps> = store => {
  const setTradeable = (x: Tradeable) => store.dispatch(actions.setTradeable(x));
  const setOperation = (x: Operation) => store.dispatch(actions.setOperation(x));
  const setWallet = (x: WalletAccountRef | null) => store.dispatch(actions.setWallet(x));
  const startTransaction = () => store.dispatch(actions.startTransaction());

  const setAmount = (ws: WidgetState) => (x: string) => {
    const fixed = fixDecimals(x, ws.tradeable.decimals);
    if (ws.amount !== fixed) {
      store.dispatch(actions.setAmount(fixed));
    }
  };

  return ws => {
    const amountError = getAmountError(ws);
    const balanceError = getBalanceError(ws);
    return {
      tradeableList: ws.config.tokens,
      tradeable: ws.tradeable,
      walletList: getWalletList(ws),
      wallet: ws.selectedWallet,
      amountError,
      balanceError,
      canSubmit:
        amountError == null &&
        balanceError == null &&
        ws.selectedWallet != null &&
        ws.orderbook != null,
      amount: ws.amount,
      gasPrice: ws.gasPrice,
      operation: ws.operation,
      expectedVolume: amountError == null ? expectedVolume(ws) : null,
      expectedVolumeEth: expectedVolumeEth(ws),
      networkCost: networkCost(ws),
      actions: {
        setAmount: setAmount(ws),
        setTradeable,
        setOperation,
        setWallet,
        startTransaction,
      },
    };
  };
};

const WidgetForm: React.SFC<WidgetFormProps> = props => (
  <Screen kind="form">
    <OperationSelector value={props.operation} onChange={props.actions.setOperation} />
    <FormField label={`${props.operation} Amount`} htmlFor="token" error={props.amountError}>
      <div className={classes.flexWrapper}>
        <AmountField amount={props.amount} onChange={props.actions.setAmount} />
        <TokenSelector
          operation={props.operation}
          tokens={props.tradeableList}
          selectedToken={props.tradeable}
          onChange={props.actions.setTradeable}
        />
      </div>
    </FormField>
    <WalletSelector
      selectedWallet={props.wallet}
      wallets={props.walletList}
      tradeable={props.tradeable}
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
            token={props.tradeable}
          />{' '}
          ETH / {props.tradeable.symbol}
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
        <img src={DEXDEX_ICON} alt="DEXDEX" />
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
