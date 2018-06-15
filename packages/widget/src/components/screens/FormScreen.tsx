import * as React from 'react';
import { RenderMapper } from '.';
import { Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { Wallet } from '../../model/wallets';
import { GasPrice } from '../../model/widget';
import { Operations, WalletDetails, WidgetState } from '../../model/widget-state';
import * as actions from '../../model/widget-state/actions';
import { networkFee, expectedVolumeEth } from '../../model/widget-state/selectors';
import { fixDecimals } from '@dexdex/utils/lib/format';
import AmountField from '../AmountField';
import OperationSelector from '../OperationSelector';
import TokenSelector from '../TokenSelector';
import WalletSelector from '../WalletSelector';

const DEXDEX_ICON = require('../icons/dexdex.svg');

export interface WidgetFormProps {
  actions: Operations;
  tradeableList: Tradeable[];
  tradeable: Tradeable;
  walletList: Wallet[];
  wallet: Wallet | null;
  walletDetails: null | WalletDetails;
  isValidAmount: boolean;
  canSubmit: boolean;
  amount: string; // expressed in Tokens #
  gasPrice: GasPrice;
  operation: Operation;
  volumeEthWithFee: string;
  networkFee: { ether: string; usd: string };
}

export const mapper: RenderMapper<WidgetFormProps> = store => {
  const setTradeable = (x: Tradeable) => store.dispatch(actions.setTradeable(x));
  const setOperation = (x: Operation) => store.dispatch(actions.setOperation(x));
  const setWallet = (x: Wallet | null) => store.dispatch(actions.setWallet(x));
  const startTransaction = () => store.dispatch(actions.startTransaction());

  const setAmount = (ws: WidgetState) => (x: string) => {
    const fixed = fixDecimals(x, ws.tradeable.decimals);
    if (ws.amount !== fixed) {
      store.dispatch(actions.setAmount(fixed));
    }
  };

  return ws => ({
    tradeableList: ws.config.tokens,
    tradeable: ws.tradeable,
    walletList: ws.config.wallets,
    wallet: ws.wallet,
    walletDetails: ws.walletDetails,
    isValidAmount: ws.isValidAmount,
    canSubmit: ws.isValidAmount && ws.wallet != null && ws.orderbook != null,
    amount: ws.amount,
    gasPrice: ws.gasPrice,
    operation: ws.operation,
    volumeEthWithFee: expectedVolumeEth(ws),
    networkFee: networkFee(ws),
    actions: {
      setAmount: setAmount(ws),
      setTradeable,
      setOperation,
      setWallet,
      startTransaction,
    },
  });
};

const WidgetForm: React.SFC<WidgetFormProps> = props => (
  <div className="widget">
    <OperationSelector value={props.operation} onChange={props.actions.setOperation} />
    <label className="label flex-grid" htmlFor="token">
      {props.operation} Amount
    </label>
    <div className="Amount flex-grid margin-bottom">
      <AmountField
        amount={props.amount}
        onChange={props.actions.setAmount}
        error={!props.isValidAmount}
      />
      <TokenSelector
        operation={props.operation}
        tokens={props.tradeableList}
        selectedToken={props.tradeable}
        onChange={props.actions.setTradeable}
      />
    </div>
    <WalletSelector
      selectedWallet={props.wallet}
      walletDetails={props.walletDetails}
      wallets={props.walletList}
      onChange={props.actions.setWallet}
    />
    <div className="summary">
      <div className="summary-token margin-bottom">
        <div className="summary-token-price flex-grid">
          <label className="col">DAI Price</label>
          <div className="summary-token-price-value value col">0.02332 ETH</div>
        </div>
      </div>
      <div className="summary-total flex-grid">
        <label className="col">Total</label>
        <div className="summary-total-value value col">{props.volumeEthWithFee}</div>
      </div>
    </div>
    <div className="gas-info flex-grid">
      <label className="label col" htmlFor="item-3">
        Network Cost
      </label>
      <div className="gas-price-value col">
        {props.networkFee.ether} ETH / $ {props.networkFee.usd}
      </div>
    </div>
    <div className="flex-grid">
      <button
        className="btn-submit col"
        disabled={!props.canSubmit}
        onClick={props.actions.startTransaction}
      >
        Confirm
      </button>
    </div>
    <div className="footer flex-grid-responsive">
      <div className="col-1">
        <img src={DEXDEX_ICON} alt="Powered by DEXDEX" />
      </div>
      <div className="col-2">
        <p>
          By clicking confirm, you agree to our <a href="#">terms & services</a>
        </p>
      </div>
    </div>
  </div>
);

export { WidgetForm as Screen };
