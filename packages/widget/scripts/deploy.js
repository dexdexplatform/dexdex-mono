#!/usr/bin/env node

// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// run build
const build = require('./build');
const { execSync } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const paths = require('../config/paths');

/** Run Shell command */
const sh = cmd => execSync(cmd, { encoding: 'utf8' }).trim();
const check = (assertion, msg) => {
  if (!assertion) {
    console.error(chalk.red(msg));
    process.exit(1);
  }
};

const project = process.argv[2];
const ValidProjects = ['staging', 'production'];

check(ValidProjects.includes(project), `Need to specify project!\nValid value: ${ValidProjects}`);
check(sh('git status --porcelain').length === 0, 'You have uncommited files, cannot publish');

const currentBranch = sh('git rev-parse --abbrev-ref HEAD');

if (project === 'production') {
  check(currentBranch === 'master', 'You can only publish from master branch');
}

sh(`git fetch origin ${currentBranch}`);
check(
  sh(`git rev-parse ${currentBranch}`) === sh(`git rev-parse origin/${currentBranch}`),
  'Push changes before publish'
);

function writeFirebaseConfig() {
  const manifest = fs.readJsonSync(path.join(paths.appBuild, 'asset-manifest.json'));
  const firebaseConfig = fs.readJsonSync(paths.appFirebaseConfig);
  if (!('hosting' in firebaseConfig)) {
    firebaseConfig.hosting = {};
  }
  if (!('redirects' in firebaseConfig.hosting)) {
    firebaseConfig.hosting.redirects = [];
  }
  firebaseConfig.hosting.redirects.push({
    source: '/noiframe-widget.js',
    destination: '/' + manifest['iframe.js'],
    type: 302,
  });
  firebaseConfig.hosting.redirects.push({
    source: '/noiframe-widget.css',
    destination: '/' + manifest['iframe.css'],
    type: 302,
  });
  fs.writeJsonSync(paths.appFirebaseConfig, firebaseConfig, { spaces: 2 });
}

async function run(projectName) {
  await build();
  const currentCommit = sh('git rev-parse --short HEAD');
  fs.writeFileSync(path.join(paths.appBuild, '__version'), currentCommit);
  writeFirebaseConfig();
  sh(`yarn firebase deploy --project ${projectName}`);
  sh('git checkout firebase.json'); // reset firebase config
}

run(project).catch(err => {
  console.error(err);
  process.exit(1);
});
