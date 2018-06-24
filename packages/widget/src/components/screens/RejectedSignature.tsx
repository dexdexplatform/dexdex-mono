import * as React from 'react';
import { RenderMapper } from '.';
import { goBack } from '../../model/widget-state/actions';

export interface RejectedSignatureScreenProps {
  goBack: () => void;
}

export const mapper: RenderMapper<RejectedSignatureScreenProps> = store => {
  const props = {
    goBack: () => store.dispatch(goBack()),
  };

  return ws => props;
};

const RejectedSignatureScreen: React.SFC<RejectedSignatureScreenProps> = props => (
  <div className="info-screen error">
    <div className="error-screen-header">
      <h1 className="symbol">:(</h1>
      <h1 className="message">You rejected us...</h1>
    </div>
    <div className="info-screen-content">
      <p className="mb-2">should we start again?</p>
    </div>
    <button onClick={props.goBack} className="btn-submit">
      Go Gack
    </button>
  </div>
);

export { RejectedSignatureScreen as Screen };
