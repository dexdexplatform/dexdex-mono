import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Screen as ErrorScreen } from '../components/screens/ErrorScreen';
import { Screen as RejectedSignature } from '../components/screens/RejectedSignature';
import { Screen as RequestAllowanceScreen } from '../components/screens/RequestAllowanceScreen';
import { Screen as TradeProgressScreen } from '../components/screens/TradeProgressScreen';
import { Screen as TradeSuccessScreen } from '../components/screens/TradeSuccessScreen';
import { Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';

const tokenA: Tradeable = {
  address: '0xbc98051d2cd1eeaa4b396dcde34624e5cd4d50e3',
  buy_price: 1,
  sell_price: 1,
  decimals: 5,
  last_day_buy_price_change: 11,
  last_day_sellPrice_change: 11,
  name: 'TokenA',
  symbol: 'TKA',
  website: 'ddddd',
};

const data = {
  operation: 'buy' as Operation,
  tradeable: tokenA,
  amount: '25.5',
  txEtherRange: { min: '0.05', max: '0.07' },
  networkFee: { ether: '0.0001', usd: '3.4' },
  fromAddress: '0xbc98051d2cd1eeaa4b396dcde34624e5cd4d50e3',
  tradeTxHash: 'asdfsdfasdfsdfsdafsdafd',
};

const ScreenTest: React.SFC<{ name: string }> = ({ name, children }) => (
  <div>
    <h4>{name}</h4>
    <div style={{ marginBottom: 200, borderTop: 'solid 1px #EEE' }}>{children}</div>
  </div>
);
const TestApp = () => (
  <div>
    <h1>Widget Screen Stages</h1>
    <ScreenTest name="Request Allowance Screen - Signature">
      <RequestAllowanceScreen tokenSymbol={data.tradeable.symbol} volume={data.amount} />
    </ScreenTest>
    <ScreenTest name="Request Allowance Screen - Waiting Ethereum">
      <RequestAllowanceScreen
        tokenSymbol={data.tradeable.symbol}
        volume={data.amount}
        txHash={'asdfsdfasdfsdfsdafsdafd'}
      />
    </ScreenTest>
    <ScreenTest name="Trade Screen - Signature">
      <TradeProgressScreen
        amount={data.amount}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkFee={data.networkFee}
        tradeable={data.tradeable}
        volumeEthWithFee={data.txEtherRange.max}
      />
    </ScreenTest>
    <ScreenTest name="Trade Screen - Waiting Ethereum">
      <TradeProgressScreen
        amount={data.amount}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkFee={data.networkFee}
        tradeable={data.tradeable}
        volumeEthWithFee={data.txEtherRange.max}
        txHash={'asdfsdfasdfsdfsdafsdafd'}
      />
    </ScreenTest>
    <ScreenTest name="Trade Finished OK">
      <TradeSuccessScreen
        amount={data.amount}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkFee={data.networkFee}
        tradeable={data.tradeable}
        volumeEthWithFee={data.txEtherRange.max}
        tradeTxHash={data.tradeTxHash}
      />
    </ScreenTest>
    <ScreenTest name="Error Screen">
      <ErrorScreen goBack={() => console.log('go back cliked!')} />
    </ScreenTest>
    <ScreenTest name="Rejected Signature Screen">
      <RejectedSignature goBack={() => console.log('go back cliked!')} />
    </ScreenTest>
  </div>
);

ReactDOM.render(<TestApp />, document.getElementById('root') as HTMLElement);
