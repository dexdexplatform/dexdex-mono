import { merge } from 'rxjs';
import { WidgetState } from '..';
import { ServerApi } from '../../server-api';
import { Actions } from '../actions';
import { Epic } from '../store';
import { orderbook } from './orderbook';
import { executeTradeEpic } from './trade-exec';
import { wallets, noWalletWarning } from './wallets';

export type WidgetEpic = Epic<WidgetState, Actions>;

const rootEpic = (api: ServerApi): WidgetEpic => changes =>
  merge(
    orderbook(api)(changes),
    wallets(changes),
    executeTradeEpic(api)(changes),
    noWalletWarning(changes)
  );

export default rootEpic;
