import * as React from 'react';
import { ErrorMessage } from '../model/form-error';
import { FormatError } from './FormatError';

const classes = require('./FormField.css');

export type FormFieldProps = {
  htmlFor?: string;
  label: string;
  error?: null | ErrorMessage;
};
export const FormField: React.SFC<FormFieldProps> = props => {
  return (
    <div className={classes.formField}>
      <div className={classes.name}>
        <label className={classes.label} htmlFor={props.htmlFor}>
          {props.label}
        </label>
        <div className={classes.errorMsg}>{props.error && <FormatError msg={props.error} />}</div>
      </div>
      {props.children}
    </div>
  );
};
