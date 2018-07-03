# Dexdex Monorepo

This repository holds dexdex platform libraries.

## Documentation

- [Embed widget into your site](https://github.com/dexdexplatform/dexdex-mono/wiki/Widget--Install)
- [Custom install](https://github.com/dexdexplatform/dexdex-mono/wiki/Custom-install) 
- [Trading API](https://github.com/dexdexplatform/dexdex-mono/wiki/API---Trading)

## Current Packages

- **lib-erc20 [@dexdex/erc20]**: Typescript proxy for ERC20 contracts
- **lib-model [@dexdex/model]**: Model classes & modules common in dexdex
- **lib-utils [@dexdex/utils]**: Shared utilities
- **lib-rx [@dexdex/rx]**: RX utilities
- **typescript-typings**: Typescript declarations for used libraries
- **widget**: Easytrade Widget

## Package naming convention

Rules:

1.  Use `lib-` prefix for libraries. The package name (inside `package.json`) MUST BE
    `@dexdex/{pkgName}`, but the folder where it lives MUST BE `lib-{pkgName}`
2.  `widget` & `typescript-typings` are special and unique packages. The first is the
    code for our widget, which is hosted by dexdex. The latter, accumulates all
    typescript definitions.

## Setup Development

After you clone the github project do:

1.  `yarn`: Install dependencies
2.  `yarn bootstrap`: Creates links packages (runs `lerna bootstrap`)

## Available Scripts

The following **yarn** scripts are provided:

- `yarn packages:build`: Builds all the packages (by doing `yarn build` on each package)
- `yarn packages:watch`: Build in watch mode all library packages (by doing `yarn watch` on each library package)
- `yarn packages:clean`: Clean build in all packages (by doing `yarn clean` on each package)
- `yarn packages:publish`: Publish library packages to npm (runs `lerna publish`)
- `yarn packages:test`: Runs test in all packages (by doing `yarn test` on each package)
- `yarn test`: Alias of `yarn packages:test`

## Development Workflow

After you follow "Setup Development" steps you can:

1.  `yarn packages:watch` to keep updated build files for libraries
2.  `cd packages/widget; yarn rundev` to run widget dev server

If you are not actively working on libraries, just the widget you can run: `yarn packages:build`
instead of `watch`.

## Rules for new packages

If you want to create a new package, you need to follow some rules.

### For Any package

1.  Copy `jest.config.js`:

```js
module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/*.test.(ts|tsx)'],
  rootDir: './src',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
```

2.  Copy `tsconfig.json`

```js
{
  "extends": "../../tsconfig",
  "compilerOptions": {
    "outDir": "lib"
  },
  "include": ["./src/**/*"]
}
```

### For Libraries

1.  Name your package folder `lib-{pkgName}`
2.  Name your package (package.json/name): `@dexdex/{pkgName}`
3.  Use this `package.json` template:

```json
{
  "name": "@dexdex/model", // YOUR pkgName here
  "version": "0.0.57",
  "description": "DexDex core services",
  "repository": "https://github.com/dexdexplatform/dexdex-mono",
  "author": "Mariano A. Cortesi <mariano@dexdex.io>",
  "license": "MIT",
  "main": "lib/index.js", // main file MUST be lib/index.js
  "types": "lib/index.d.ts", // typing for main file (when you import @dexdex/model for example)
  "scripts": {
    // Required script to work with root package.json
    "precommit": "lint-staged",
    "clean": "rm -rf lib",
    "prebuild": "yarn clean",
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "prepublishOnly": "yarn test && yarn build"
  },
  "lint-staged": {
    // Lint Staged configuration
    "src/**/*.{js,jsx,ts,tsx,json,css}": ["prettier -l"]
  },
  "devDependencies": {
    "@types/jest": "^22.2.3",
    "@types/node": "^9.6.5",
    "jest": "^22.4.3",
    "lint-staged": "^7.0.4",
    "prettier": "^1.12.1",
    "ts-jest": "^22.4.4",
    "typescript": "^2.8.1"
  },
  "dependencies": {
    "tslib": "^1.9.0"
  }
}
```

## Troubleshooting

### Packages not properly linked

If you face any problem where some packages doesn't seem to find another package on the monorepo,
try:

`yarn lerna link`

and try again

### yarn packages:watch fails

Right now, `yarn packages:watch` runs compilation on all projects in parallel. This creates a race
condition for packages that depend on other packages. For example: `lib-model` depends on `lib-utils`
and it can fail it `lib-utils` hasn't compile yet.

The safe way of avoiding this, is to first do a `yarn packages:build` and then `yarn packages:watch`
