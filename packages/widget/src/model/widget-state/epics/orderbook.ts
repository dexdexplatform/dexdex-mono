import { map, switchMap } from 'rxjs/operators';
import { select } from '@dexdex/rx';
import { ServerApi } from '../../server-api';
import { orderbookEvent, Actions } from '../actions';
import { Epic } from '../store';
import { WidgetState } from '..';

export const orderbook = (api: ServerApi): Epic<WidgetState, Actions> => changes =>
  changes.pipe(
    select('state', 'token'),
    switchMap(token => api.orderBookWatcher(token.address)),
    map(orderbookEvent)
  );
