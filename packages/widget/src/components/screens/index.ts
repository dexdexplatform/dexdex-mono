import { WidgetState, WidgetStore } from '../../model/widget-state';
import * as ErrorScreen from './ErrorScreen';
import * as form from './FormScreen';
import * as allowanceScreen from './RequestAllowanceScreen';
import * as tradeProgress from './TradeProgressScreen';
import * as tradeSuccess from './TradeSuccessScreen';
import { TxStage } from '../../model/widget';

export type RenderMapper<T> = (store: WidgetStore) => (ws: WidgetState) => T;

export type Screen<T> = {
  mapper: RenderMapper<T>;
  Screen: React.ComponentType<T>;
};

const screens: Record<TxStage, Screen<any>> = {
  [TxStage.Idle]: form,
  [TxStage.TokenAllowanceInProgress]: allowanceScreen,
  [TxStage.TradeInProgress]: tradeProgress,
  [TxStage.RequestTokenAllowanceSignature]: allowanceScreen,
  [TxStage.RequestTradeSignature]: tradeProgress,
  [TxStage.TradeCompleted]: tradeSuccess,
  [TxStage.TradeFailed]: ErrorScreen,
  [TxStage.UnkownError]: ErrorScreen,
  [TxStage.LedgerNotConnected]: ErrorScreen,
  [TxStage.SignatureRejected]: ErrorScreen,
};

export default screens;
