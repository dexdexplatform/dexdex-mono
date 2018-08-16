declare module '@ledgerhq/hw-transport' {
  import EventEmitter from 'events';

  export interface Subscription {
    unsubscribe: () => void;
  }

  export type Device = any;

  export interface DescriptorEvent<Descriptor> {
    type: 'add' | 'remove';
    descriptor: Descriptor;
    device?: Device;
  }

  /**
   */
  export interface Observer<Ev> {
    next: (event: Ev) => void;
    error: (e: any) => void;
    complete: () => void;
  }

  /**
   * all possible status codes.
   * @see https://github.com/LedgerHQ/blue-app-btc/blob/d8a03d10f77ca5ef8b22a5d062678eef788b824a/include/btchip_apdu_constants.h#L85-L115
   * @example
   * import { StatusCodes } from "@ledgerhq/hw-transport";
   */
  export const StatusCodes: {
    PIN_REMAINING_ATTEMPTS: number;
    INCORRECT_LENGTH: number;
    COMMAND_INCOMPATIBLE_FILE_STRUCTURE: number;
    SECURITY_STATUS_NOT_SATISFIED: number;
    CONDITIONS_OF_USE_NOT_SATISFIED: number;
    INCORRECT_DATA: number;
    NOT_ENOUGH_MEMORY_SPACE: number;
    REFERENCED_DATA_NOT_FOUND: number;
    FILE_ALREADY_EXISTS: number;
    INCORRECT_P1_P2: number;
    INS_NOT_SUPPORTED: number;
    CLA_NOT_SUPPORTED: number;
    TECHNICAL_PROBLEM: number;
    OK: number;
    MEMORY_PROBLEM: number;
    NO_EF_SELECTED: number;
    INVALID_OFFSET: number;
    FILE_NOT_FOUND: number;
    INCONSISTENT_FILE: number;
    ALGORITHM_NOT_SUPPORTED: number;
    INVALID_KCV: number;
    CODE_NOT_INITIALIZED: number;
    ACCESS_CONDITION_NOT_FULFILLED: number;
    CONTRADICTION_SECRET_CODE_STATUS: number;
    CONTRADICTION_INVALIDATION: number;
    CODE_BLOCKED: number;
    MAX_VALUE_REACHED: number;
    GP_AUTH_FAILED: number;
    LICENSING: number;
    HALTED: number;
  };

  export function getAltStatusMessage(code: number): void | string;

  /**
   * TransportError is used for any generic transport errors.
   * e.g. Error thrown when data received by exchanges are incorrect or if exchanged failed to communicate with the device for various reason.
   */
  export class TransportError extends Error {
    id: string;
    constructor(message: string, id: string);
  }

  /**
   * Error thrown when a device returned a non success status.
   * the error.statusCode is one of the `StatusCodes` exported by this library.
   */
  export class TransportStatusError extends Error {
    statusCode: number;
    statusText: string;
    constructor(statusCode: number);
  }

  /**
   * A **Descriptor** is a parametric type that is up to be determined for the implementation.
   * it can be for instance an ID, an file path, a URL,...
   */
  export interface TransportStatic<Descriptor, T extends Transport> {
    /**
     * Statically check if a transport is supported on the user's platform/browser.
     */
    isSupported(): Promise<boolean>;

    /**
     * List once all available descriptors. For a better granularity, checkout `listen()`.
     * @return a promise of descriptors
     * @example
     * TransportFoo.list().then(descriptors => ...)
     */
    list(): Promise<Descriptor[]>;

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
    listen(observer: Observer<DescriptorEvent<Descriptor>>): Subscription;

    /**
     * attempt to create a Transport instance with potentially a descriptor.
     * @param descriptor: the descriptor to open the transport with.
     * @param timeout: an optional timeout
     * @return a Promise of Transport instance
     * @example
     *   TransportFoo.open(descriptor).then(transport => ...)
     */
    open(descriptor: Descriptor, timeout?: number): Promise<T>;

    /**
     * create() allows to open the first descriptor available or
     * throw if there is none or if timeout is reached.
     * This is a light helper, alternative to using listen() and open() (that you may need for any more advanced usecase)
     * @example
     *  TransportFoo.create().then(transport => ...)
     */
    create(openTimeout?: number, listenTimeout?: number): Promise<T>;
  }

  /**
   * Transport defines the generic interface to share between node/u2f impl
   * A **Descriptor** is a parametric type that is up to be determined for the implementation.
   * it can be for instance an ID, an file path, a URL,...
   */
  export default abstract class Transport {
    /**
     * low level api to communicate with the device
     * This method is for implementations to implement but should not be directly called.
     * Instead, the recommanded way is to use send() method
     * @param apdu the data to send
     * @return a Promise of response data
     */
    exchange(apdu: Buffer): Promise<Buffer>;

    /**
     * set the "scramble key" for the next exchanges with the device.
     * Each App can have a different scramble key and they internally will set it at instanciation.
     * @param key the scramble key
     */
    setScrambleKey(key: string): void;

    /**
     * close the exchange with the device.
     * @return a Promise that ends when the transport is closed.
     */
    close(): Promise<void>;

    /**
     * Listen to an event on an instance of transport.
     * Transport implementation can have specific events. Here is the common events:
     * * `"disconnect"` : triggered if Transport is disconnected
     */
    on(eventName: string, cb: Function): void;

    /**
     * Stop listening to an event on an instance of transport.
     */
    off(eventName: string, cb: Function): void;

    /**
     * Enable or not logs of the binary exchange
     */
    setDebugMode(debug: boolean | ((log: string) => void)): void;

    /**
     * Set a timeout (in milliseconds) for the exchange call. Only some transport might implement it. (e.g. U2F)
     */
    setExchangeTimeout(exchangeTimeout: number): void;

    /**
     * wrapper on top of exchange to simplify work of the implementation.
     * @param cla
     * @param ins
     * @param p1
     * @param p2
     * @param data
     * @param statusList is a list of accepted status code (shorts). [0x9000] by default
     * @return a Promise of response buffer
     */
    send(
      cla: number,
      ins: number,
      p1: number,
      p2: number,
      data?: Buffer,
      statusList?: number[]
    ): Promise<Buffer>;

    protected decorateAppAPIMethods(
      self: Object,
      methods: Array<string>,
      scrambleKey: string
    ): void;
  }
}
