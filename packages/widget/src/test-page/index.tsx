import { Operation } from '@dexdex/model/lib/base';
import { Tradeable } from '@dexdex/model/lib/tradeable';
import { toTokenDecimals } from '@dexdex/utils/lib/units';
import { BN } from 'bn.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Screen as ErrorScreen } from '../components/screens/ErrorScreen';
import { Screen as RejectedSignature } from '../components/screens/RejectedSignature';
import { Screen as RequestAllowanceScreen } from '../components/screens/RequestAllowanceScreen';
import { Screen as TradeProgressScreen } from '../components/screens/TradeProgressScreen';
import { Screen as TradeSuccessScreen } from '../components/screens/TradeSuccessScreen';
import '../components/Widget.css';
import { WalletInfo, WalletId } from '../model/wallets/index';

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
  amountBN: toTokenDecimals('25.5', 5),
  expectedVolumeEth: new BN('100000000000000000'),
  networkCost: new BN('1000000000'),
  fromAddress: '0xbc98051d2cd1eeaa4b396dcde34624e5cd4d50e3',
  tradeTxHash: 'asdfsdfasdfsdfsdafsdafd',
};

const ScreenTest: React.SFC<{ name: string }> = ({ name, children }) => (
  <div>
    <h4>{name}</h4>
    <div style={{ maxWidth: 505, margin: '5px auto', border: 'solid 1px gray' }}>{children}</div>
  </div>
);
const TestApp: React.SFC = () => (
  <div>
    <h1>Widget Screen Stages</h1>
    <ScreenTest name="Request Allowance Screen - Signature">
      <RequestAllowanceScreen token={data.tradeable} volume={data.amountBN} />
    </ScreenTest>
    <ScreenTest name="Request Allowance Screen - Waiting Ethereum">
      <RequestAllowanceScreen
        token={data.tradeable}
        volume={data.amountBN}
        txHash={'asdfsdfasdfsdfsdafsdafd'}
      />
    </ScreenTest>
    <ScreenTest name="Trade Screen - Signature">
      <TradeProgressScreen
        expectedVolume={data.amountBN}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkCost={data.networkCost}
        tradeable={data.tradeable}
        expectedVolumeEth={data.expectedVolumeEth}
      />
    </ScreenTest>
    <ScreenTest name="Trade Screen - Waiting Ethereum">
      <TradeProgressScreen
        expectedVolume={data.amountBN}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkCost={data.networkCost}
        tradeable={data.tradeable}
        expectedVolumeEth={data.expectedVolumeEth}
        txHash={'asdfsdfasdfsdfsdafsdafd'}
      />
    </ScreenTest>
    <ScreenTest name="Trade Finished OK">
      <TradeSuccessScreen
        amount={data.amount}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkCost={data.networkCost}
        tradeable={data.tradeable}
        effectiveVolumeEth={data.expectedVolumeEth}
        effectiveVolume={data.expectedVolumeEth}
        tradeTxHash={data.tradeTxHash}
        wallet={WalletInfo[WalletId.MetaMask]}
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

async function main() {
  ReactDOM.render(<TestApp />, document.getElementById('root') as HTMLElement);
}

main().catch(err => {
  console.error('Error: ', err);
});
