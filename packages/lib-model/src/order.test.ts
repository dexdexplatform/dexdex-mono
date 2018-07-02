import { BN } from 'bn.js';
import { Order, fromJsonOrder } from './order';

describe('Order Model', () => {
  describe('fromJsonOrder()', () => {
    it('marshall/unmarshall should be indempotent', () => {
      const o: Order = {
        id: 'o1',
        token: 'aaaaaaaaaaaaaaaaaaa',
        isSell: false,
        decimals: 0.1,
        volume: new BN('100000000000000000000'),
        volumeEth: new BN('60000000000000000000'),
        fee: new BN('6000000'),
        price: 10,
        remaining: 0.5,
        ordersData: '',
      };

      const obis = fromJsonOrder(JSON.parse(JSON.stringify(o)));

      // simple fields
      expect(o.id).toBe(obis.id);
      expect(o.token).toBe(obis.token);
      expect(o.isSell).toBe(obis.isSell);
      expect(o.decimals).toBe(obis.decimals);
      expect(o.remaining).toBe(obis.remaining);

      // BN conversions
      expect(o.volume.eq(obis.volume)).toBeTruthy();
      expect(o.volumeEth.eq(obis.volumeEth)).toBeTruthy();
      expect(o.fee.eq(obis.fee)).toBeTruthy();
      expect(o.price).toBe(obis.price);
    });
  });
});
