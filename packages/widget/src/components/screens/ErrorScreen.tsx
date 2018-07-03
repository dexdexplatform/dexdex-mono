import * as React from 'react';
import { RenderMapper } from '.';
import { goBack } from '../../model/widget-state/actions';

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
  <div className={`screen ${classes.errorScreen}`}>
    <div className={classes.header}>
      <img src={imageSrc} />
      <h1>{headerMsg}</h1>
    </div>
    <div className={classes.content}>{contentMsg}</div>
    <button onClick={onClick} className={classes.btn}>
      {btnLabel}
    </button>
  </div>
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
