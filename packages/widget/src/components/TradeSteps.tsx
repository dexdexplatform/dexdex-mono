import * as React from 'react';
import classname from 'classnames';

const Steps: React.SFC = ({ children }) => <ul className="status-steps">{children}</ul>;

const Step: React.SFC<{ status: 'completed' | 'pending' | 'current'; message: string }> = ({
  status,
  message,
  children,
}) => (
  <li className={classname('step', status)}>
    <p>{message}</p>
    {children}
  </li>
);

const SubStep: React.SFC<{ status: 'completed' | 'pending' | 'current'; message: string }> = ({
  status,
  message,
  children,
}) => (
  <ul className={classname('sub-step', status)}>
    <li className="sub-step-message">
      <p>{message}</p>
    </li>
  </ul>
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
    <Step
      message="Approve us to trade on your behalf"
      status={approvalHash ? 'completed' : 'current'}
    />
    <Step
      message="Mining Approval"
      status={approvalHash ? (approvalMined ? 'completed' : 'current') : 'pending'}
    >
      {approvalHash && <SubStep status="completed" message={approvalHash} />}
    </Step>
    <Step
      message="Please approve the trade"
      status={approvalMined ? (tradeHash ? 'completed' : 'current') : 'pending'}
    />
    <Step message="Mining Trade" status={tradeHash ? 'current' : 'pending'}>
      {tradeHash && <SubStep status="completed" message={tradeHash} />}
    </Step>
  </Steps>
);

export interface BuyStepsProps {
  tradeHash?: string | null;
}

export const BuySteps: React.SFC<BuyStepsProps> = ({ tradeHash }) => (
  <Steps>
    <Step message="Please approve the trade" status={tradeHash ? 'completed' : 'current'} />
    <Step message="Mining Trade" status={tradeHash ? 'current' : 'pending'}>
      {tradeHash && <SubStep status="completed" message={tradeHash} />}
    </Step>
  </Steps>
);
