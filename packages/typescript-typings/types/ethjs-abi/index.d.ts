declare module 'ethjs-abi' {
  export type ABIType = 'address';
  export interface ABIParameter {
    name: string;
    type: ABIType;
  }

  export interface ABIEventParameter extends ABIParameter {
    indexed: boolean;
  }
  export interface ABIFunction {
    type: 'function';
    constant: boolean;
    inputs: ABIParameter[];
    name: string;
    outputs: ABIParameter[];
    payable: boolean;
    stateMutability: 'nonpayable' | 'payable' | 'view';
  }

  export interface ABIEvent {
    type: 'event';
    anonymous: boolean;
    inputs: ABIEventParameter[];
    name: string;
  }

  export function decodeEvent(eo: ABIEvent, encoded: string, topics: string[]): any;
  export function decodeLogItem(...args: any[]): any;
  export function decodeMethod(mo: ABIFunction, encoded: string): any[];

  export function decodeParams(
    names: string[],
    types: ABIType[],
    encoded: string,
    useNumberedParams?: boolean
  ): any;
  export function decodeParams(types: ABIType[], encoded: string, useNumberedParams?: boolean): any;

  /** BROKEN: do not use  */
  export function encodeEvent(eo: ABIEvent, values: any[]): string;

  export function encodeMethod(mo: ABIFunction, values: any[]): string;

  export function encodeParams(...args: any[]): any;

  export function encodeSignature(abiFn: ABIFunction): string;

  export function eventSignature(...args: any[]): any;

  export function logDecoder(...args: any[]): any;
}
