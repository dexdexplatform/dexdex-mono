import * as React from 'react';
import { FormatTxHash } from './Format';
import { TxStage } from '../model/widget';

const classes = require('./TradeSteps.css');

const Steps: React.SFC = ({ children }) => <ul className={classes.steps}>{children}</ul>;

type StepProps = {
  status: 'completed' | 'pending' | 'current';
  title: string | JSX.Element;
  statusMessage?: string | JSX.Element;
};

const Step: React.SFC<StepProps> = ({ status, title, statusMessage }) => (
  <li className={classes[status]}>
    <div>{title}</div>
    {statusMessage && <div className={classes.message}>{statusMessage}</div>}
  </li>
);

export type SellStage =
  | TxStage.RequestTokenAllowanceSignature
  | TxStage.TokenAllowanceInProgress
  | TxStage.RequestTradeSignature
  | TxStage.TradeInProgress;

export interface SellStepsProps {
  stage: SellStage;
  approvalHash?: string | null;
  tradeHash?: string | null;
}

const StepOrder = {
  [TxStage.RequestTokenAllowanceSignature]: 1,
  [TxStage.TokenAllowanceInProgress]: 2,
  [TxStage.RequestTradeSignature]: 2,
  [TxStage.TradeInProgress]: 3,
};

const statusFor = (currentStage: SellStage) => (
  targetStage: SellStage
): 'pending' | 'completed' | 'current' => {
  if (currentStage === targetStage) {
    return 'current';
  } else if (StepOrder[currentStage] > StepOrder[targetStage]) {
    return 'completed';
  } else {
    return 'pending';
  }
};

export const SellSteps: React.SFC<SellStepsProps> = ({ stage, approvalHash, tradeHash }) => {
  const withAllowance = stage === TxStage.RequestTokenAllowanceSignature || approvalHash;

  const status = statusFor(stage);

  return (
    <Steps>
      {withAllowance && (
        <>
          <Step
            title="Allowance Approval"
            status={status(TxStage.RequestTokenAllowanceSignature)}
          />
          <Step
            title={approvalHash ? <FormatTxHash value={approvalHash} /> : 'Process Allowance'}
            status={status(TxStage.TokenAllowanceInProgress)}
            statusMessage={
              status(TxStage.TokenAllowanceInProgress) === 'current'
                ? 'Waiting for mining the network'
                : undefined
            }
          />
        </>
      )}

      <Step title="Sell Approval" status={status(TxStage.RequestTradeSignature)} />
      <Step
        title={tradeHash ? <FormatTxHash value={tradeHash} /> : 'Process Sell'}
        status={status(TxStage.TradeInProgress)}
        statusMessage={tradeHash ? 'Waiting for mining the network' : undefined}
      />
    </Steps>
  );
};

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
