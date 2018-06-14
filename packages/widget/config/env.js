'use strict';

const fs = require('fs-extra');

// Make sure that including paths.js after env.js will read .env variables.
delete require.cache[require.resolve('./paths')];

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error('The NODE_ENV environment variable is required but was not specified.');
}

function getDexdexAddress() {
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
    throw new Error('dexdex contract not found in DEXDEX_CONFIG');
  }
  return dexdexConfig.dexdex;
}

function getClientEnvironment() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const raw = {
    NODE_ENV: NODE_ENV,
    DEXDEX_CONTRACT: NODE_ENV === 'development' ? getDexdexAddress() : '',
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
