import { accumulateUntil } from '.';
import { interval, Subject } from 'rxjs';
import { toArray, take } from 'rxjs/operators';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('accumulateUntil', () => {
  test('simple case', async () => {
    const numbers$ = interval(4);
    const stop = new Subject();

    const resultP = numbers$
      .pipe(
        accumulateUntil(stop),
        take(5),
        toArray()
      )
      .toPromise();

    await wait(12);
    stop.next(true);
    const result = await resultP;
    expect(result).toEqual([0, 1, 2, 3, 4]);
  });
});
