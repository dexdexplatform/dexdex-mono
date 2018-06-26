import * as React from 'react';
import { FormatTxHash } from './Format';

const Steps: React.SFC = ({ children }) => <ul className="trade-steps">{children}</ul>;

type StepProps = {
  status: 'completed' | 'pending' | 'current';
  title: string | JSX.Element;
  statusMessage?: string | JSX.Element;
};

const Step: React.SFC<StepProps> = ({ status, title, statusMessage }) => (
  <li className={`trade-steps-${status}`}>
    <div>{title}</div>
    {statusMessage && <div className="status-message">{statusMessage}</div>}
  </li>
);

export interface SellStepsProps {
  approvalHash?: string | null;
  approvalMined?: boolean;
  tradeHash?: string | null;
}

export const SellSteps: React.SFC<SellStepsProps> = ({
  approvalHash,
  approvalMined,
  tradeHash,
}) => (
  <Steps>
    <Step title="Allowance Approval" status={approvalHash ? 'completed' : 'current'} />
    {approvalHash ? (
      <Step
        title={<FormatTxHash value={approvalHash} />}
        status={approvalMined ? 'completed' : 'current'}
        statusMessage={approvalMined ? undefined : 'Waiting for mining the network'}
      />
    ) : (
      <Step title="Process Allowance" status="pending" />
    )}

    <Step
      title="Sell Approval"
      status={approvalMined ? (tradeHash ? 'completed' : 'current') : 'pending'}
    />
    <Step
      title={tradeHash ? <FormatTxHash value={tradeHash} /> : 'Process Sell'}
      status={tradeHash ? 'current' : 'pending'}
      statusMessage={tradeHash ? 'Waiting for mining the network' : undefined}
    />
  </Steps>
);

export interface BuyStepsProps {
  tradeHash?: string | null;
}

export const BuySteps: React.SFC<BuyStepsProps> = ({ tradeHash }) => (
  <Steps>
    <Step title="Buy Approval" status={tradeHash ? 'completed' : 'current'} />
    <Step
      title={tradeHash ? <FormatTxHash value={tradeHash} /> : 'Process Buy'}
      status={tradeHash ? 'current' : 'pending'}
      statusMessage={tradeHash ? 'Waiting for mining the network' : undefined}
    />
  </Steps>
);
