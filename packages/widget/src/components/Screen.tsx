import * as React from 'react';

const classes = require('./Screen.css');

type ScreenProps = {
  title?: string | JSX.Element;
  kind: 'info' | 'form' | 'error';
};

const Screen: React.SFC<ScreenProps> = ({ title, kind, children }) => (
  <div className={`${classes.screen} ${classes[kind]}`}>
    {title != null && <h1 className={classes.screenTitle}>{title}</h1>}
    {children}
  </div>
);

const ScreenHeader: React.SFC = ({ children }) => (
  <div className={classes.screenHeader}>{children}</div>
);

const ScreenContent: React.SFC = ({ children }) => (
  <div className={classes.screenContent}>{children}</div>
);

export { Screen, ScreenContent, ScreenHeader };
