export interface Tradeable {
  symbol: string;
  name: string;
  website: string;
  address: string;
  image_url?: string;

  decimals: number;

  /** sell price expressed in Ethers */
  sell_price: number;
  /** buy price expressed in Ethers */
  buy_price: number;
  /** buy price variation in the last 24hs (percentage expressed in [0,1]) */
  last_day_buy_price_change: number;
  /** sell price variation in the last 24hs (percentage expressed in [0,1]) */
  last_day_sellPrice_change: number;
}
