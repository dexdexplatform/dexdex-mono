import * as React from 'react';
import { RenderMapper } from '.';
import { goBack } from '../../model/widget-state/actions';

export interface ErrorScreenProps {
  goBack: () => void;
}

export const mapper: RenderMapper<ErrorScreenProps> = store => {
  const props = {
    goBack: () => store.dispatch(goBack()),
  };

  return ws => props;
};

const errorIcon = require('../icons/error.svg');

const ErrorScreen: React.SFC<ErrorScreenProps> = props => (
  <div className="screen screen-error">
    <div className="error-screen-header">
      <img src={errorIcon} />
      <h1 className="error-screen-message">
        Ohhh!! <br /> There was an error!
      </h1>
    </div>
    <div className="info-screen-content">
      <p className="mb-2">Should we start again?</p>
    </div>
    <button className="btn-submit">YEAH!</button>
  </div>
);

export { ErrorScreen as Screen };
