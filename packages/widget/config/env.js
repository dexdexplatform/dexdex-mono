'use strict';

const fs = require('fs-extra');

// Make sure that including paths.js after env.js will read .env variables.
delete require.cache[require.resolve('./paths')];

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error('The NODE_ENV environment variable is required but was not specified.');
}

if (!process.env.DEXDEX_CONFIG) {
  throw new Error('The DEXDEX_CONFIG environment variable is required but was not specified.');
}

let dexdexConfig;
try {
  dexdexConfig = fs.readJsonSync(process.env.DEXDEX_CONFIG);
} catch (err) {
  throw new Error(`Can't read & parse DEXDEX_CONFIG (${process.env.DEXDEX_CONFIG}`);
}
if (!dexdexConfig.dexdex) {
  throw new Error(`dexdex contract not found in DEXDEX_CONFIG`);
}

function getClientEnvironment(publicUrl) {
  const raw = {
    // Useful for determining whether we’re running in production mode.
    // Most importantly, it switches React into the correct mode.
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Useful for resolving the correct path to static assets in `public`.
    // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
    // This should only be used as an escape hatch. Normally you would put
    // images into the `src` and `import` them in code to get their paths.
    PUBLIC_URL: publicUrl,

    DEXDEX_CONTRACT: dexdexConfig.dexdex,
  };
  // Stringify all values so we can feed into Webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

module.exports = getClientEnvironment;
