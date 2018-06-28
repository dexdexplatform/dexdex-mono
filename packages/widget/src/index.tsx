import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Widget from './components/Widget';
import { appConfig } from './config';

if (window.parent !== window) {
  document.body.classList.add('content-root');
}

ReactDOM.render(<Widget widgetId={appConfig().widgetId} />, document.getElementById('dexdex-root'));
