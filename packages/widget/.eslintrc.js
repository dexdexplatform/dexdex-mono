module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
    // sourceType: 'module',
  },
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  rules: {
    'no-console': 0,
  },
};
