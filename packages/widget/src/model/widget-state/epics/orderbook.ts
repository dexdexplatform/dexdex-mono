import { map, switchMap } from 'rxjs/operators';
import { select } from '@dexdex/rx';
import { ServerApi } from '../../server-api';
import { orderbookEvent, Actions } from '../actions';
import { Epic } from '../store';
import { WidgetState } from '..';

export const orderbook = (api: ServerApi): Epic<WidgetState, Actions> => changes =>
  changes.pipe(
    select('state', 'tradeable'),
    switchMap(tradeable => api.orderBookWatcher(tradeable.address)),
    map(orderbookEvent)
  );
