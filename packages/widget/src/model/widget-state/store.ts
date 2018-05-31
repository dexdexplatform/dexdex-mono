import { BehaviorSubject, Observable, merge } from 'rxjs';
import { ignoreElements, map, publishReplay, refCount, scan, tap } from 'rxjs/operators';

export interface Action {
  type: string;
  payload?: any;
}

export interface PayloadAction<A, P> {
  type: A;
  payload: P;
}

export interface SimpleAction<A> {
  type: A;
}

export interface Change<S, A extends Action> {
  action: A;
  state: S;
}

export type Reducer<S, A extends Action> = (state: S | undefined, action: A) => S;
export type Epic<S, A extends Action> = (changes$: Observable<Change<S, A>>) => Observable<A>;

export interface Store<S, A extends Action> {
  state: Observable<S>;
  changes: Observable<Change<S, A>>;
  dispatch: (action: A) => void;
}

export function createStore<S, A extends Action>(reducer: Reducer<S, A>, epic: Epic<S, A>) {
  const initialAction = { type: '___INITIAL_ACTION___' } as A;
  const actions = new BehaviorSubject<A>(initialAction);

  // From @sherman Originaly we had this
  // this._dispacher = new BehaviorSubject(reducer(undefined, action));
  // this._state = this._dispacher
  //     .delay(0) // I need to add this to avoid "circular dependencies" in the suscription chain
  //               // Basically it forces the action to be fired in a different context than the current
  //     ;

  const dispatch = (action: A) => {
    actions.next(action);
  };

  const applyChange = (oldChange: Change<S, A>, action: A) => ({
    action,
    state: reducer(oldChange.state, action),
  });

  let changes: Observable<Change<S, A>> = actions.pipe(
    scan(applyChange, { action: null, state: undefined } as any),
    publishReplay(1),
    refCount()
  );

  // In order to connect epics without actually subscribing
  // we combine tap(dispatch) & ignoreElement to get an Observable that on subscription
  // won't emit, but will call dispatch() with every epic emited action.
  const applyEpic: Observable<any> = epic(changes).pipe(
    tap(dispatch),
    ignoreElements()
  );

  // By merging changes & applyEpic, we get the Observable<Changes> with the side effect
  // of subscribing to the epics at the same time.
  changes = merge(changes, applyEpic).pipe(
    publishReplay(1),
    refCount()
  );

  return {
    changes,
    state: changes.pipe(map(c => c.state)),
    dispatch,
  };
}
