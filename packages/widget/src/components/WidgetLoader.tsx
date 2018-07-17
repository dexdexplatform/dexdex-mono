import * as React from 'react';
import Loader from './Loader';

const classes = require('./WidgetLoader.css');

const WidgetLoader: React.SFC = () => (
  <div className={classes.widgetLoader}>
    <Loader />
  </div>
);

export default WidgetLoader;
