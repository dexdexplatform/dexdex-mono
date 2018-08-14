import * as React from 'react';
import { RenderMapper } from '.';
import { goBack } from '../../model/widget-state/actions';
import { Screen, ScreenContent, ScreenHeader } from '../Screen';
import { TxStage } from '../../model/widget';

const classes = require('./ErrorScreen.css');

const errorIcon = require('../icons/error.svg');
const rejectedIcon = require('../icons/rejected.svg');

export const mapper: RenderMapper<ErrorScreenProps> = store => {
  const onClick = () => store.dispatch(goBack());

  return ws => {
    const stage = ws.tradeExecution.stage;
    if (stage === TxStage.UnkownError || stage === TxStage.TradeFailed) {
      return {
        onClick,
        imageSrc: errorIcon,
        headerMsg: (
          <>
            Ohhh!! <br /> There was an error!
          </>
        ),
        contentMsg: 'Should we start again?',
        btnLabel: 'YEAH!',
      };
    } else if (stage === TxStage.SignatureRejected) {
      return {
        onClick,
        imageSrc: rejectedIcon,
        headerMsg: 'You rejected us...',
        contentMsg: 'Should we start again?',
        btnLabel: 'Go Gack',
      };
    } else if (stage === TxStage.LedgerNotConnected) {
      return {
        onClick,
        imageSrc: rejectedIcon,
        headerMsg: 'Ledger is disconnected',
        contentMsg: 'Please unlock ledger and try again',
        btnLabel: 'Go Gack',
      };
    } else {
      throw new Error(`can't render ErrorScreen in stage: ${stage}`);
    }
  };
};

export interface ErrorScreenProps {
  onClick: () => void;
  imageSrc: string;
  headerMsg: string | JSX.Element;
  contentMsg: string | JSX.Element;
  btnLabel: string | JSX.Element;
}
const ErrorScreen: React.SFC<ErrorScreenProps> = ({
  onClick,
  imageSrc,
  headerMsg,
  contentMsg,
  btnLabel,
}) => (
  <Screen kind="error">
    <ScreenHeader>
      <img src={imageSrc} />
      <h1 className={classes.headerTitle}>{headerMsg}</h1>
    </ScreenHeader>
    <ScreenContent>{contentMsg}</ScreenContent>
    <button onClick={onClick} className={classes.btn}>
      {btnLabel}
    </button>
  </Screen>
);

export { ErrorScreen as Screen };
