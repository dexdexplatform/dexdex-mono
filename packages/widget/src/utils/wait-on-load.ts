import { Observable, Observer, Subscription, asapScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';

const waitOnLoad = <A>(input: Observable<A>): Observable<A> => {
  return Observable.create((observer: Observer<A>) => {
    const s: Subscription = new Subscription();
    const start = () => {
      const childS = input
        // input could be sync, and won't let us do s.add(childS), so we
        //  make it async just in case
        .pipe(observeOn(asapScheduler))
        // then we subscribe
        .subscribe({
          next: x => observer.next(x),
          error: e => observer.error(e),
          complete: () => observer.complete(),
        });
      s.add(childS);
    };

    switch (document.readyState) {
      case 'loading':
        s.add(() => {
          window.removeEventListener('load', start);
        });
        window.addEventListener('load', start);
        return;
      default:
        start();
    }

    return s;
  });
};

export { waitOnLoad };
