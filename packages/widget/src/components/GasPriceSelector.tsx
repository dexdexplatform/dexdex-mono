import className from 'classnames';
import * as React from 'react';
import { GasPrice } from '../model/widget';

export interface GasPriceSelectorProps {
  value: GasPrice;
  totalETHCost: string;
  totalUSDCost: string;
  onChange: (newPrice: GasPrice) => void;
}

const Prices = [GasPrice.Slow, GasPrice.Normal, GasPrice.Fast];

const GasPriceSelector: React.SFC<GasPriceSelectorProps> = ({
  value,
  totalETHCost,
  totalUSDCost,
  onChange,
}) => (
  <div className="gas-selector">
    <div className="flex-grid">
      <label className="gas-selector-label col" htmlFor="item-3">
        Network Cost ▾
      </label>
      <div className="gas-price-value col">
        {totalETHCost} ETH / $ {totalUSDCost}
      </div>
    </div>
    <input className="hide" type="checkbox" name="one" id="item-3" defaultChecked />
    <div className="hide3">
      <div className="gas-price-btn flex-grid inner3">
        {Prices.map(gp => (
          <button
            key={gp}
            className={className('col', value === gp && 'selected')}
            onClick={() => onChange(gp)}
          >
            {gp}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default GasPriceSelector;
