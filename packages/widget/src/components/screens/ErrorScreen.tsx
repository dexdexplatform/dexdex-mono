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
  <div className="widget-status">
    <h1 className="error">Ohhh!! There was an error!</h1>
    <h2>should we start again?</h2>
    <button onClick={props.goBack}>YEAH!</button>
  </div>
);

export { ErrorScreen as Screen };
