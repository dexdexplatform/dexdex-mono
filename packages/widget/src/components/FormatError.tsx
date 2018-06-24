import * as React from 'react';
import { ErrorMessage, ErrorCode } from '../model/form-error';
import { FormatToken } from './Format';
import { DivMode } from '@dexdex/utils/lib/units';

type MsgFor<E extends ErrorCode, T = ErrorMessage> = T extends { code: E } ? T : never;

type Formatters = { [k in ErrorCode]: React.SFC<{ errMsg: MsgFor<k> }> };

const ErrorFormatters: Formatters = {
  [ErrorCode.VolumeTooSmall]: ({ errMsg }) => (
    <span>
      Minimun Amount is{' '}
      <FormatToken value={errMsg.minVolume} token={errMsg.token} mode={DivMode.Ceil} />
    </span>
  ),
  [ErrorCode.VolumeTooBig]: ({ errMsg }) => (
    <span>
      Maximum Amount is{' '}
      <FormatToken value={errMsg.maxVolume} token={errMsg.token} mode={DivMode.Floor} />
    </span>
  ),
  [ErrorCode.VolumeBadFormat]: () => <span>Invalid Number</span>,
  [ErrorCode.NotEnoughEther]: () => <span>Insuffient Ethers</span>,
  [ErrorCode.NotEnoughTokens]: () => <span>Insuffient Tokens</span>,
  [ErrorCode.CantPayNetwork]: () => <span>Insuffient Ethers to pay network cost</span>,
};

export class FormatError extends React.PureComponent<{ msg: ErrorMessage }> {
  render() {
    const Formatter = ErrorFormatters[this.props.msg.code] as any;
    return <Formatter errMsg={this.props.msg} />;
  }
}
