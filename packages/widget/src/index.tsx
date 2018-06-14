import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Widget from './components/Widget';
import { widgetId } from './config';

ReactDOM.render(<Widget widgetId={widgetId} />, document.getElementById('root'));
