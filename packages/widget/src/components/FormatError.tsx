import * as React from 'react';
import { ErrorMessage, ErrorCode } from '../model/form-error';
import { FormatToken } from './Format';

export class FormatError extends React.PureComponent<{ msg: ErrorMessage }> {
  render() {
    const errMsg = this.props.msg;
    switch (errMsg.code) {
      case ErrorCode.VolumeTooSmall:
        return (
          <div>
            Minimun Amount is <FormatToken value={errMsg.minVolume} token={errMsg.token} />
          </div>
        );
      case ErrorCode.VolumeTooBig:
        return (
          <div>
            Maximum Amount is <FormatToken value={errMsg.maxVolume} token={errMsg.token} />
          </div>
        );
      case ErrorCode.InsufficientFunds:
        return <div>Insuffient Balance to do the trade</div>;
      case ErrorCode.CantPayNetwork:
        return <div>Insuffient Balance to pay network cost</div>;
      default:
        throw new Error(`BUG: error message=${this.props.msg}`);
    }
  }
}
