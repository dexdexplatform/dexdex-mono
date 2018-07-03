import * as React from 'react';
import { RenderMapper } from '.';
import { goBack } from '../../model/widget-state/actions';
import { Screen, ScreenContent, ScreenHeader } from '../Screen';

const classes = require('./ErrorScreen.css');

const errorIcon = require('../icons/error.svg');
const rejectedIcon = require('../icons/rejected.svg');

export interface ErrorScreenProps {
  goBack: () => void;
}

export const errorMapper: RenderMapper<ErrorScreenProps> = store => {
  const props = {
    goBack: () => store.dispatch(goBack()),
  };

  return ws => props;
};

export interface BaseErrorScreenProps {
  onClick: () => void;
  imageSrc: string;
  headerMsg: string | JSX.Element;
  contentMsg: string | JSX.Element;
  btnLabel: string | JSX.Element;
}
const BaseErrorScreen: React.SFC<BaseErrorScreenProps> = ({
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

const ErrorScreen: React.SFC<ErrorScreenProps> = props => (
  <BaseErrorScreen
    imageSrc={errorIcon}
    headerMsg={
      <>
        Ohhh!! <br /> There was an error!
      </>
    }
    contentMsg="Should we start again?"
    onClick={goBack}
    btnLabel="YEAH!"
  />
);

const RejectedSignatureScreen: React.SFC<ErrorScreenProps> = props => (
  <BaseErrorScreen
    imageSrc={rejectedIcon}
    headerMsg="You rejected us..."
    contentMsg="Should we start again?"
    onClick={goBack}
    btnLabel="Go Gack"
  />
);

export { RejectedSignatureScreen, ErrorScreen };
