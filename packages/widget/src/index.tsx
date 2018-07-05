import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Widget from './components/Widget';
import { appConfig } from './config';

if (window.parent !== window) {
  document.body.classList.add('content-root');
}

const dexdexRoot = document.getElementById('dexdex-root');
if (dexdexRoot == null) {
  console.error('missing dexdex-root element');
  throw new Error('missing dexdex-root element');
}
const widgetRoot = document.createElement('div');
widgetRoot.id = 'widget-root';
dexdexRoot.appendChild(widgetRoot);

const modalRoot = document.createElement('div');
modalRoot.id = 'modal-root';
dexdexRoot.appendChild(modalRoot);

ReactDOM.render(<Widget widgetId={appConfig().widgetId} />, document.getElementById('widget-root'));
