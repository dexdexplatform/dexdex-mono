// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const webpack = require('webpack');
const config = require('../config/webpack.config.prod');
const paths = require('../config/paths');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const {
  measureFileSizesBeforeBuild,
  printFileSizesAfterBuild,
} = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

// Create the production build and print the deployment instructions.
function build() {
  console.log('Creating an optimized production build...');

  let compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }
      const messages = formatWebpackMessages(stats.toJson({}, true));
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' || process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n'
          )
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }
      return resolve({
        stats,
        warnings: messages.warnings,
      });
    });
  });
}

function copyPublicFolder() {
  const FILES_TO_COPY = ['404.html', 'favicon.png', 'widget.js'];
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => {
      const filename = path.basename(file);

      return file === paths.appPublic || FILES_TO_COPY.includes(filename);
    },
  });

  fs.mkdirp(path.join(paths.appBuild, 'content'));

  const webpackManifest = fs.readJsonSync(path.join(paths.appBuild, 'asset-manifest.json'));

  const content = fs.readFileSync(path.join(paths.appPublic, 'content/iframe.html'), {
    encoding: 'utf8',
  });

  fs.writeFileSync(
    path.join(paths.appBuild, 'content/iframe.html'),
    content
      .replace('src="/content/iframe.js"', `src="/${webpackManifest['iframe.js']}"`)
      .replace('<!--%CSS%-->', `<link href="/${webpackManifest['iframe.css']}" rel="stylesheet">`)
  );
}

function printSummary(previousFileSizes, stats, warnings) {
  if (warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.\n'));
    console.log(warnings.join('\n\n'));
    console.log(
      '\nSearch for the ' +
        chalk.underline(chalk.yellow('keywords')) +
        ' to learn more about each warning.'
    );
    console.log(
      'To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n'
    );
  } else {
    console.log(chalk.green('Compiled successfully.\n'));
  }

  console.log('File sizes after gzip:\n');
  printFileSizesAfterBuild(
    stats,
    previousFileSizes,
    paths.appBuild,
    WARN_AFTER_BUNDLE_GZIP_SIZE,
    WARN_AFTER_CHUNK_GZIP_SIZE
  );
  console.log();
}

async function run() {
  try {
    const previousFileSizes = await measureFileSizesBeforeBuild(paths.appBuild);
    fs.emptyDirSync(paths.appBuild);
    const { stats, warnings } = await build();
    copyPublicFolder();
    printSummary(previousFileSizes, stats, warnings);
  } catch (err) {
    console.log(chalk.red('Failed to compile.\n'));
    printBuildError(err);
    throw err;
  }
}

module.exports = run;

if (require.main === module) {
  run().catch(() => {
    process.exit(1);
  });
}
