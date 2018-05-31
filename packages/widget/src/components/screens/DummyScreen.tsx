import * as React from 'react';
import { RenderMapper } from '.';
import { WidgetState } from '../../model/widget-state';

const DummyScreen: React.SFC<WidgetState> = props => (
  <div className="widget">
    <h1>SCREEN: {props.screen}</h1>
    <dl>
      <dt>Operation</dt>
      <dd>{props.operation}</dd>
      <dt>Wallet Details</dt>
      <dd>{JSON.stringify(props.walletDetails, null, 2)}</dd>
      <dt>Token</dt>
      <dd>{props.tradeable.name}</dd>
      <dt>Token Amount</dt>
      <dd>{props.amount}</dd>
      <dt>Transaction Hash</dt>
      <dd>{props.tradeTxHash}</dd>
    </dl>
  </div>
);

export const mapper: RenderMapper<WidgetState> = store => ws => ws;

export { DummyScreen as Screen };
