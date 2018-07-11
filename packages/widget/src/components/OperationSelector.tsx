import className from 'classnames';
import * as React from 'react';
import { Operation } from '@dexdex/model/lib/base';

const classes = require('./OperationSelector.css');

export interface OperationSelectorProps {
  enabledOperations: Operation[];
  value: Operation;
  onChange: (newValue: Operation) => void;
}

const OperationSelector: React.SFC<OperationSelectorProps> = ({
  enabledOperations,
  value,
  onChange,
}) => (
  <div className={classes.operationSelector}>
    {enabledOperations.map(op => (
      <button
        key={op}
        className={className(value === op && classes.selected)}
        onClick={() => {
          if (value !== op) {
            onChange(op);
          }
        }}
      >
        {op}
      </button>
    ))}
  </div>
);

export default OperationSelector;
