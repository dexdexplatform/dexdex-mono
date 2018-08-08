declare module '@ledgerhq/hw-transport-u2f' {
  import { DescriptorEvent, Observer, Subscription } from '@ledgerhq/hw-transport';
  import { default as Transport, TransportStatic } from '@ledgerhq/hw-transport';

  export default class TransportU2F extends Transport {
    /**
     * Statically check if a transport is supported on the user's platform/browser.
     */
    static isSupported(): Promise<boolean>;

    /**
     * List once all available descriptors. For a better granularity, checkout `listen()`.
     * @return a promise of descriptors
     * @example
     * TransportFoo.list().then(descriptors => ...)
     */
    static list(): Promise<null[]>;

    /**
     * Listen all device events for a given Transport. The method takes an Obverver of DescriptorEvent and returns a Subscription (according to Observable paradigm https://github.com/tc39/proposal-observable )
     * a DescriptorEvent is a `{ descriptor, type }` object. type can be `"add"` or `"remove"` and descriptor is a value you can pass to `open(descriptor)`.
     * each listen() call will first emit all potential device already connected and then will emit events can come over times,
     * for instance if you plug a USB device after listen() or a bluetooth device become discoverable.
     * @param observer is an object with a next, error and complete function (compatible with observer pattern)
     * @return a Subscription object on which you can `.unsubscribe()` to stop listening descriptors.
     * @example
     *   const sub = TransportFoo.listen({
     *     next: e => {
     *       if (e.type==="add") {
     *         sub.unsubscribe();
     *         const transport = await TransportFoo.open(e.descriptor);
     *         ...
     *       }
     *     },
     *     error: error => {},
     *     complete: () => {}
     *   })
     */
    static listen(observer: Observer<DescriptorEvent<null>>): Subscription;

    /**
     * attempt to create a Transport instance with potentially a descriptor.
     * @param descriptor: the descriptor to open the transport with.
     * @param timeout: an optional timeout
     * @return a Promise of Transport instance
     * @example
     *   TransportFoo.open(descriptor).then(transport => ...)
     */
    static open(descriptor: null, timeout?: number): Promise<TransportU2F>;

    /**
     * create() allows to open the first descriptor available or
     * throw if there is none or if timeout is reached.
     * This is a light helper, alternative to using listen() and open() (that you may need for any more advanced usecase)
     * @example
     *  TransportFoo.create().then(transport => ...)
     */
    static create(openTimeout?: number, listenTimeout?: number): Promise<TransportU2F>;
  }
}
