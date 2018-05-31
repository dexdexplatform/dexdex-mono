import { WidgetScreen, WidgetState, WidgetStore } from '../../model/widget-state';
import * as error from './ErrorScreen';
import * as form from './FormScreen';
import * as rejectedSignature from './RejectedSignature';
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
  rejectedSignature: rejectedSignature,
  error: error,
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
