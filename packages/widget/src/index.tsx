import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Widget from './components/Widget';

function readDedexConfig() {
  const dedexScripts = document.querySelectorAll('script[data-dexdex-id]');
  if (dedexScripts.length === 0) {
    console.error('dexdex: missing attribute data-dexdex-id in <script/> tag');
    return null;
  } else if (dedexScripts.length > 1) {
    console.error('dexdex: Too many dexdex scripts. We only support one');
    return null;
  }
  const dexdexScript = dedexScripts[0];

  const widgetId = dexdexScript.getAttribute('data-dexdex-id')!;
  const customTargetId = dexdexScript.getAttribute('data-dexdex-target');

  let target: HTMLElement;
  if (customTargetId) {
    const customTarget = document.getElementById(customTargetId);
    if (!customTarget) {
      console.error(`dexdex: custom target doesn't exist: ${customTargetId}`);
      return null;
    }
    target = customTarget;
  } else {
    target = document.createElement('div');
    target.id = `dexdex-${widgetId}`;
    dexdexScript.parentNode!.insertBefore(target, dexdexScript.nextSibling);
  }

  return {
    widgetId,
    target,
  };
}

const config = readDedexConfig();

if (config) {
  ReactDOM.render(
    <Widget opts={{ url: 'http://localhost:8000' }} widgetId={config.widgetId} />,
    config.target
  );
}
