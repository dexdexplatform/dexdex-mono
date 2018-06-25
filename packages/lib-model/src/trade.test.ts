import { BN } from 'bn.js';
import { Trade, TradeState, fromJson, toJson } from './trade';
import { Buffer } from 'buffer';

describe('Trade', () => {
  test('to/fromJson()', () => {
    const trade: Trade = {
      affiliateAddress: '0x0000000001000000000200000000030000000004',
      depositAddress: '0x0000000001000000000200000000030000000004',
      senderAddress: '0x0000000001000000000200000000030000000004',
      tradeableAddress: '0x0000000001000000000200000000030000000004',
      isSell: true,
      id: 'aaaaaaaaaaaaaaaaaaa',
      ordersData: Buffer.from('00000000000000', 'hex'),
      txhash: '0x000000000100000000020000000003000000000400000000050000000006aaaa',
      state: TradeState.Completed,
      executionDate: new Date(),
      createdDate: new Date(),
      updatedDate: new Date(),
      gasPrice: new BN(1),
      gasUsed: new BN(100),
      volume: new BN(1000000),
      volumeEth: new BN(1000),
      volumeEffective: new BN(5),
      volumeEthEffective: new BN(2),
    };

    const tradeBis = fromJson(JSON.parse(JSON.stringify(toJson(trade))));

    expect(tradeBis).toMatchObject(trade);
    // expect(tradeBis.volume).toMatchObject(trade.volume);
  });
});
