import BN from 'bn.js';
import { Order, fromJsonOrder, toJsonOrder } from './order';

describe('Order Model', () => {
  describe('fromJsonOrder()', () => {
    it('marshall/unmarshall should be indempotent', () => {
      const o: Order = {
        id: 'o1',
        token: 'aaaaaaaaaaaaaaaaaaa',
        isSell: false,
        decimals: 0.1,
        remainingVolume: new BN('100000000000000000000'),
        remainingVolumeEth: new BN('60000000000000000000'),
        price: 10,
        ordersData: '',
      };

      const obis = fromJsonOrder(JSON.parse(JSON.stringify(toJsonOrder(o))));

      // simple fields
      expect(o.id).toBe(obis.id);
      expect(o.token).toBe(obis.token);
      expect(o.isSell).toBe(obis.isSell);
      expect(o.decimals).toBe(obis.decimals);

      // BN conversions
      expect(o.remainingVolume.eq(obis.remainingVolume)).toBeTruthy();
      expect(o.remainingVolumeEth.eq(obis.remainingVolumeEth)).toBeTruthy();
      expect(o.price).toBe(obis.price);
    });
  });
});
