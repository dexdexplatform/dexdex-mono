declare module 'ethereumjs-abi' {
  import { Buffer } from 'buffer';
  export type EVMType =
    | 'address'
    | 'bool'
    | 'string'
    | 'uint'
    | 'uint8'
    | 'uint160'
    | 'uint256'
    | 'int8'
    | 'int160'
    | 'int256'
    | 'bytes32'
    | 'bytes';
  export function rawEncode(types: EVMType[], values: any[]): Buffer;
  export function rawDecode(types: EVMType[], data: Buffer): Buffer[];

  export function stringify(types: EVMType[], value: Buffer[]): string[];

  export function soliditySHA3(types: EVMType[], vallue: any[]): Buffer;
  export function soliditySHA256(types: EVMType[], vallue: any[]): Buffer;
}
