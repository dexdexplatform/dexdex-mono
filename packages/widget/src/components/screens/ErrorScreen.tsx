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

const ErrorScreen: React.SFC<ErrorScreenProps> = props => (
  <div className="info-screen error">
    <div className="error-screen-header">
      <h1 className="symbol">Ohhh!!</h1>
      <h1 className="message">There was an error!</h1>
    </div>
    <p>should we start again?</p>
    <button className="btn-submit">YEAH!</button>
  </div>
);

export { ErrorScreen as Screen };
