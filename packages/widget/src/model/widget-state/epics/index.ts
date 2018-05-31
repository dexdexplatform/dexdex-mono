import { merge } from 'rxjs';
import { WidgetState } from '..';
import { ServerApi } from '../../server-api';
import { Actions } from '../actions';
import { Epic } from '../store';
import { orderbook } from './orderbook';
import { runTransaction } from './transaction';
import { walletDetails } from './wallet-details';

export type WidgetEpic = Epic<WidgetState, Actions>;

const rootEpic = (api: ServerApi): WidgetEpic => changes =>
  merge(orderbook(api)(changes), walletDetails(changes), runTransaction(changes));

export default rootEpic;
