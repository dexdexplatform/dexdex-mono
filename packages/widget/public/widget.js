'use strict';

(function() {
  function toQueryString(params) {
    return Object.keys(params)
      .map(
        key =>
          params[key] != null
            ? encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
            : null
      )
      .filter(str => str != null)
      .join('&');
  }

  function getScript() {
    const dedexScripts = document.querySelectorAll('script[data-dexdex-id]');
    if (dedexScripts.length === 0) {
      console.error('dexdex: missing attribute data-dexdex-id in <script/> tag');
      return null;
    } else if (dedexScripts.length > 1) {
      console.error('dexdex: Too many dexdex scripts. We only support one');
      return null;
    }
    const dexdexScript = dedexScripts[0];
    return dexdexScript;
  }

  function createIframeURL(dexdexScript) {
    const iframeUrl = new URL('../content/iframe.html', dexdexScript.src);
    const parameters = {
      'dexdex-id': dexdexScript.getAttribute('data-dexdex-id'),
      net: dexdexScript.getAttribute('data-net'),
      operations: dexdexScript.getAttribute('data-operations'),
      tokens: dexdexScript.getAttribute('data-tokens'),
    };
    return iframeUrl.toString() + '#' + toQueryString(parameters);
  }

  function setAttributes(elem, attrsMap) {
    Object.keys(attrsMap).forEach(key => elem.setAttribute(key, attrsMap[key]));
  }

  function insertScript(customTargetId, iframeUrl, widgetId) {
    let target;
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
      dexdexScript.parentNode.insertBefore(target, dexdexScript.nextSibling);
    }
    const ifrm = document.createElement('iframe');

    ifrm.setAttribute('id', `dexdex-iframe-${widgetId}`);
    ifrm.setAttribute('src', iframeUrl);
    setAttributes(ifrm, {
      width: '100%',
      height: 500,
      style: 'border: none; width: 1px; min-width: 100%;', // iOS Safari iframe sizing workaround
      allowTransparency: 'yes',
      marginwidth: 0,
      marginheight: 0,
      frameBorder: 0,
      scrolling: 'no',
    });

    target.appendChild(ifrm);
  }

  const dexdexScript = getScript();
  if (dexdexScript) {
    const customTargetId = dexdexScript.getAttribute('data-dexdex-target');
    const widgetId = dexdexScript.getAttribute('data-dexdex-id');
    const iframeUrl = createIframeURL(dexdexScript);
    insertScript(customTargetId, iframeUrl, widgetId);
  }
})();
