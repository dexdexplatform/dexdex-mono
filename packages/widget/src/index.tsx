import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Widget from './components/Widget';
import { appConfig } from './config';

ReactDOM.render(<Widget widgetId={appConfig().widgetId} />, document.getElementById('dexdex-root'));
