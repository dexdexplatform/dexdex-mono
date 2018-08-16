declare module '@ledgerhq/hw-app-eth' {
  import Transport from '@ledgerhq/hw-transport';

  /**
   * Ethereum API
   *
   * @example
   * import Eth from "@ledgerhq/hw-app-eth";
   * const eth = new Eth(transport)
   */
  export default class Eth {
    transport: Transport;

    constructor(transport: Transport);

    /**
     * get Ethereum address for a given BIP 32 path.
     * @param path a path in BIP 32 format
     * @option boolDisplay optionally enable or not the display
     * @option boolChaincode optionally enable or not the chaincode request
     * @return an object with a publicKey, address and (optionally) chainCode
     * @example
     * eth.getAddress("44'/60'/0'/0'/0").then(o => o.address)
     */
    getAddress(
      path: string,
      boolDisplay?: boolean,
      boolChaincode?: boolean
    ): Promise<{
      publicKey: string;
      address: string;
      chainCode?: string;
    }>;

    /**
     * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign
     * @example
     *  eth.signTransaction("44'/60'/0'/0'/0", "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080").then(result => ...)
     */
    signTransaction(
      path: string,
      rawTxHex: string
    ): Promise<{
      s: string;
      v: string;
      r: string;
    }>;

    getAppConfiguration(): Promise<{
      arbitraryDataEnabled: number;
      version: string;
    }>;

    /**
     * You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
     * @example
     *  eth.signPersonalMessage("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(result => {
     *    var v = result['v'] - 27;
     *    v = v.toString(16);
     *    if (v.length < 2) {
     *      v = "0" + v;
     *    }
     *    console.log("Signature 0x" + result['r'] + result['s'] + v);
     *  })
     */
    signPersonalMessage(
      path: string,
      messageHex: string
    ): Promise<{
      v: number;
      s: string;
      r: string;
    }>;
  }
}
