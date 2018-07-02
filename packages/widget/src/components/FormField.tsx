import * as React from 'react';
import { ErrorMessage } from '../model/form-error';
import { FormatError } from './FormatError';

export type FormFieldProps = {
  htmlFor?: string;
  label: string;
  error?: null | ErrorMessage;
};
export const FormField: React.SFC<FormFieldProps> = props => {
  return (
    <>
      <div className="flex-grid">
        <label className="label" htmlFor={props.htmlFor}>
          {props.label}
        </label>
        <div className="error-msg">{props.error && <FormatError msg={props.error} />}</div>
      </div>
      <div className="flex-grid margin-bottom">{props.children}</div>
    </>
  );
};
