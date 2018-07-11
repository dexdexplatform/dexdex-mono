import { concat, defer, from, interval, Observable, OperatorFunction } from 'rxjs';
import {
  bufferWhen,
  concatAll,
  concatMap,
  distinctUntilChanged,
  filter,
  first,
  map,
  share,
  startWith,
  take,
  toArray,
} from 'rxjs/operators';

export const removeNull = <A>(input$: Observable<A | null>): Observable<A> =>
  input$.pipe(filter(x => x != null)) as Observable<A>;

/** Converts a function that returns a promise into an Observable */
export function promiseFactory<A>(fn: () => Promise<A>): Observable<A> {
  return defer(() => from(fn()));
}

export function seqAsync<A1, B>(
  f1: () => Promise<A1>,
  fn: (v1: A1) => Observable<B>
): Observable<B> {
  return promiseFactory(f1).pipe(concatMap(fn));
}

export function pollDifferences<A>(opts: {
  period: number;
  poller: () => Promise<A>;
  compareFn?: (before: A, after: A) => boolean;
}): Observable<A> {
  return interval(opts.period).pipe(
    startWith(-1),
    concatMap(() => promiseFactory(opts.poller)),
    distinctUntilChanged(opts.compareFn)
  );
}

export function select<S, K1 extends keyof S>(arg1: K1): OperatorFunction<S, S[K1]>;
export function select<S, K1 extends keyof S, K2 extends keyof S[K1]>(
  arg1: K1,
  arg2: K2
): OperatorFunction<S, S[K1][K2]>;
export function select<S, K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(
  arg1: K1,
  arg2: K2,
  arg3: K3
): OperatorFunction<S, S[K1][K2][K3]>;
export function select<
  S,
  K1 extends keyof S,
  K2 extends keyof S[K1],
  K3 extends keyof S[K1][K2],
  K4 extends keyof S[K1][K2][K3]
>(arg1: K1, arg2: K2, arg3: K3, arg4: K4): OperatorFunction<S, S[K1][K2][K3][K4]>;
export function select<
  S,
  K1 extends keyof S,
  K2 extends keyof S[K1],
  K3 extends keyof S[K1][K2],
  K4 extends keyof S[K1][K2][K3],
  K5 extends keyof S[K1][K2][K3][K4]
>(arg1: K1, arg2: K2, arg3: K3, arg4: K4, arg5: K5): OperatorFunction<S, S[K1][K2][K3][K4][K5]>;
export function select<
  S,
  K1 extends keyof S,
  K2 extends keyof S[K1],
  K3 extends keyof S[K1][K2],
  K4 extends keyof S[K1][K2][K3],
  K5 extends keyof S[K1][K2][K3][K4],
  K6 extends keyof S[K1][K2][K3][K4][K5]
>(
  arg1: K1,
  arg2: K2,
  arg3: K3,
  arg4: K4,
  arg5: K5,
  arg6: K6
): OperatorFunction<S, S[K1][K2][K3][K4][K5][K6]>;
export function select<S>(...args: Array<keyof S>) {
  return (input: Observable<S>) =>
    input.pipe(
      map(state =>
        args.reduce((subState: any, key: keyof S) => {
          if (typeof subState === 'object') {
            return subState[key];
          } else {
            return subState;
          }
        }, state)
      ),
      distinctUntilChanged()
    );
}

export function accumulateUntil(notifier: Observable<any>) {
  return <A>(input: Observable<A>): Observable<A> => {
    const sharedNotifier = notifier.pipe(
      first(),
      share()
    );
    const sharedInput = input.pipe(share());

    return concat(
      sharedInput.pipe(
        bufferWhen(() => sharedNotifier),
        first(),
        concatAll()
      ),
      sharedInput
    );
  };
}

export const sample = <A>(input: Observable<A>, n: number) =>
  input
    .pipe(
      take(n),
      toArray()
    )
    .toPromise();
