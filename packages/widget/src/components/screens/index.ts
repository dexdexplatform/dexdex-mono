import { WidgetScreen, WidgetState, WidgetStore } from '../../model/widget-state';
import { errorMapper, ErrorScreen, RejectedSignatureScreen } from './ErrorScreen';
import * as form from './FormScreen';
import { Screen as RequestAllowanceScreen } from './RequestAllowanceScreen';
import * as tradeProgress from './TradeProgressScreen';
import * as tradeSuccess from './TradeSuccessScreen';
import { getTokenAllowanceInfo } from '../../model/widget-state/selectors';

export type RenderMapper<T> = (store: WidgetStore) => (ws: WidgetState) => T;

export type Screen<T> = {
  mapper: RenderMapper<T>;
  Screen: React.ComponentType<T>;
};
const screens: Record<WidgetScreen, Screen<any>> = {
  rejectedSignature: { mapper: errorMapper, Screen: RejectedSignatureScreen },
  error: { mapper: errorMapper, Screen: ErrorScreen },
  form: form,
  signatureApproval: {
    mapper: () => getTokenAllowanceInfo,
    Screen: RequestAllowanceScreen,
  },
  waitingApproval: {
    mapper: () => getTokenAllowanceInfo,
    Screen: RequestAllowanceScreen,
  },
  signatureTrade: tradeProgress,
  waitingTrade: tradeProgress,
  tradeSuccess: tradeSuccess,
};

export default screens;
