import { Actions } from '../actions';
import { Change } from '../store';
import { WidgetState } from '..';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export function filterAction<A extends Actions>(key: A['type']) {
  return (changes: Observable<Change<WidgetState, Actions>>) =>
    changes.pipe(filter(ch => ch.action.type === key)) as Observable<Change<WidgetState, A>>;
}
