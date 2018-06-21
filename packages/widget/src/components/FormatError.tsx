import * as React from 'react';
import { ErrorMessage, ErrorCode } from '../model/form-error';
import { FormatToken } from './Format';

type MsgFor<E extends ErrorCode, T = ErrorMessage> = T extends { code: E } ? T : never;

type Formatters = { [k in ErrorCode]: React.SFC<{ errMsg: MsgFor<k> }> };

const ErrorFormatters: Formatters = {
  [ErrorCode.VolumeTooSmall]: ({ errMsg }) => (
    <div>
      Minimun Amount is <FormatToken value={errMsg.minVolume} token={errMsg.token} />
    </div>
  ),
  [ErrorCode.VolumeTooBig]: ({ errMsg }) => (
    <div>
      Maximum Amount is <FormatToken value={errMsg.maxVolume} token={errMsg.token} />
    </div>
  ),
  [ErrorCode.VolumeBadFormat]: () => <div>Invalid Number</div>,
  [ErrorCode.NotEnoughEther]: () => <div>Insuffient Ethers</div>,
  [ErrorCode.NotEnoughTokens]: () => <div>Insuffient Tokens</div>,
  [ErrorCode.CantPayNetwork]: () => <div>Insuffient Ethers to pay network cost</div>,
};

export class FormatError extends React.PureComponent<{ msg: ErrorMessage }> {
  render() {
    const Formatter = ErrorFormatters[this.props.msg.code] as any;
    return <Formatter errMsg={this.props.msg} />;
  }
}
