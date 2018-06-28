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

const rejectedIcon = require('../icons/rejected.svg');

const RejectedSignatureScreen: React.SFC<RejectedSignatureScreenProps> = props => (
  <div className="screen screen-error">
    <div className="error-screen-header">
      <img src={rejectedIcon} />
      <h1 className="error-screen-message">You rejected us...</h1>
    </div>
    <div className="info-screen-content">
      <p className="mb-2">Should we start again?</p>
    </div>
    <button onClick={props.goBack} className="btn-submit">
      Go Gack
    </button>
  </div>
);

export { RejectedSignatureScreen as Screen };
