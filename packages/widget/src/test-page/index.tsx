import { Operation } from '@dexdex/model/lib/base';
import { Token } from '@dexdex/model/lib/token';
import { toTokenDecimals } from '@dexdex/utils/lib/units';
import BN from 'bn.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ErrorScreen, RejectedSignatureScreen } from '../components/screens/ErrorScreen';
import { Screen as RequestAllowanceScreen } from '../components/screens/RequestAllowanceScreen';
import { Screen as TradeProgressScreen } from '../components/screens/TradeProgressScreen';
import { Screen as TradeSuccessScreen } from '../components/screens/TradeSuccessScreen';
import '../components/Widget.css';
import { WalletInfo, WalletId } from '../model/wallets/index';

const tokenA: Token = {
  address: '0xbc98051d2cd1eeaa4b396dcde34624e5cd4d50e3',
  decimals: 5,
  name: 'TokenA',
  symbol: 'TKA',
  website: 'ddddd',
};

const data = {
  operation: 'buy' as Operation,
  token: tokenA,
  amount: '25.5',
  amountBN: toTokenDecimals('25.5', 5),
  expectedVolumeEth: new BN('100000000000000000'),
  networkCost: new BN('1000000000'),
  fromAddress: '0xbc98051d2cd1eeaa4b396dcde34624e5cd4d50e3',
  tradeTxHash: 'asdfsdfasdfsdfsdafsdafd',
};

type SwitcherState = {
  currentScreen: number;
};
class Switcher extends React.Component<{}, SwitcherState> {
  state: SwitcherState = {
    currentScreen: 5,
  };

  nextScreen = () => this.setState(st => ({ ...st, currentScreen: st.currentScreen + 1 }));
  prevScreen = () => this.setState(st => ({ ...st, currentScreen: st.currentScreen - 1 }));

  render() {
    const children = React.Children.toArray(this.props.children);

    const current = children[Math.abs(this.state.currentScreen % children.length)];
    return (
      <div style={{ height: '100%' }}>
        <div style={{ position: 'absolute', left: '40%' }}>
          <button style={{ backgroundColor: 'blue' }} onClick={this.prevScreen}>
            prev
          </button>
          <button style={{ backgroundColor: 'blue' }} onClick={this.nextScreen}>
            next
          </button>
        </div>
        <div style={{ height: '100%' }}>{current}</div>
      </div>
    );
  }
}

const TestApp: React.SFC = () => {
  return (
    <Switcher>
      <RequestAllowanceScreen token={data.token} volume={data.amountBN} />
      <RequestAllowanceScreen
        token={data.token}
        volume={data.amountBN}
        txHash={'asdfsdfasdfsdfsdafsdafd'}
      />
      <TradeProgressScreen
        expectedVolume={data.amountBN}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkCost={data.networkCost}
        token={data.token}
        expectedVolumeEth={data.expectedVolumeEth}
      />
      <TradeProgressScreen
        expectedVolume={data.amountBN}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkCost={data.networkCost}
        token={data.token}
        expectedVolumeEth={data.expectedVolumeEth}
        txHash={'asdfsdfasdfsdfsdafsdafd'}
      />
      <TradeSuccessScreen
        amount={data.amount}
        fromAddress={data.fromAddress}
        operation={data.operation}
        networkCost={data.networkCost}
        token={data.token}
        executionDate={new Date()}
        serviceFee={new BN('1000000000')}
        volumeEth={new BN('5000000000000000000')}
        volume={new BN('20000000')}
        effectiveVolumeEth={new BN('10000000000000000000')}
        effectiveVolume={new BN('20000000')}
        tradeTxHash={data.tradeTxHash}
        wallet={WalletInfo[WalletId.MetaMask]}
        goBack={() => console.log('go back cliked!')}
      />
      <ErrorScreen goBack={() => console.log('go back cliked!')} />
      <RejectedSignatureScreen goBack={() => console.log('go back cliked!')} />
    </Switcher>
  );
};

async function main() {
  ReactDOM.render(<TestApp />, document.getElementById('dexdex-root') as HTMLElement);
}

main().catch(err => {
  console.error('Error: ', err);
});
