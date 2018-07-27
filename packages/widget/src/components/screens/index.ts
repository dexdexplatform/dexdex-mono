import { WidgetScreen, WidgetState, WidgetStore } from '../../model/widget-state';
import { errorMapper, ErrorScreen, RejectedSignatureScreen } from './ErrorScreen';
import * as form from './FormScreen';
import * as allowanceScreen from './RequestAllowanceScreen';
import * as tradeProgress from './TradeProgressScreen';
import * as tradeSuccess from './TradeSuccessScreen';

export type RenderMapper<T> = (store: WidgetStore) => (ws: WidgetState) => T;

export type Screen<T> = {
  mapper: RenderMapper<T>;
  Screen: React.ComponentType<T>;
};
const screens: Record<WidgetScreen, Screen<any>> = {
  rejectedSignature: { mapper: errorMapper, Screen: RejectedSignatureScreen },
  error: { mapper: errorMapper, Screen: ErrorScreen },
  form: form,
  signatureApproval: allowanceScreen,
  waitingApproval: allowanceScreen,
  signatureTrade: tradeProgress,
  waitingTrade: tradeProgress,
  tradeSuccess: tradeSuccess,
};

export default screens;
