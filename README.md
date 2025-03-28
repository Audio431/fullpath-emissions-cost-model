# FullPath-EnergyEmissions-Cost-Model [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/blob/main/LICENSE) [![CI](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/CI.yml) [![Dependabot Updates](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/dependabot/dependabot-updates)

**Version:** 1.0.0
**License:** MIT

## Overview

*cost-model-addon* is a browser extension built with modern web technologies including React, TypeScript, and Webpack. This project leverages Babel for transpilation, Material UI and Emotion for styling, and a suite of tools to streamline development and packaging.

## Requirements

- **Firefox Versions:** Requires Firefox Nightly and Developer Edition  
  (see more details in the [Experimental APIs in Privileged Extensions](https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/basics.html#built-in-versus-experimental-apis))
- **Additional Settings:**  
  In the `about:config` page, set:
  - `xpinstall.signatures.required` to `false`
  - `extensions.experiments.enabled` to `true`
- **Tested Environment:**  
  - Firefox Developer Edition v137.01b
  - macOS Sequoia v15.3.2

## Installation

1. **Clone the Repository:**

   ```bash
   git clone <repository-url>
   cd cost-model-addon
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

## Available Scripts

The following npm scripts are available to manage development, building, and packaging:

| Script                | Command                                                                                                                                          | Description                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **test**              | `echo "Error: no test specified" && exit 1`                                                                                                      | Placeholder for tests (no tests currently specified).                                                               |
| **build**             | `webpack --config webpack.dev.js --mode=development --watch`                                                                                     | Bundles the project in development mode and watches for file changes.                                                 |
| **clean**             | `rm -rf dist`                                                                                                                                    | Cleans the build output by removing the `dist` directory.                                                             |
| **start:firefox**     | `web-ext run --browser-console --firefox=deved --source-dir dist`                                                                                 | Runs the extension in Firefox with the browser console enabled (using the development profile `deved`).                |
| **xpi**               | `cd dist && web-ext build --overwrite-dest && mv web-ext-artifacts/carbon_footprint_tracker-1.0.zip web-ext-artifacts/carbon_footprint_tracker-1.0.xpi` | Packages the extension as a Firefox XPI file.                                                                       |
| **build:production**  | `webpack --config webpack.prod.js --mode=production`                                                                                            | Bundles the project for production deployment.                                                                      |

## Development

- **Development Build:**  
  Run `npm run build` to start the development build with webpack in watch mode.

- **Testing in Firefox:**  
  Use `npm run start:firefox` to launch the addon in Firefox. This command will open Firefox with the extension loaded and the browser console available for debugging.

- **Packaging:**  
  After building the project, run `npm run xpi` from the root to generate an XPI package for distribution.

- **Cleaning Up:**  
  To remove previous builds, execute `npm run clean`.

## Key Dependencies

The project is developed using a robust set of devDependencies:

- **Babel & Webpack:**  
  - `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `babel-loader`  
  - `webpack`, `webpack-cli`, `copy-webpack-plugin`, `html-webpack-plugin`

- **React & TypeScript:**  
  - `react`, `react-dom`, `typescript`, `ts-loader`, `@types/react`, `@types/react-dom`

- **UI & Styling:**  
  - `@mui/material`, `@mui/icons-material`  
  - `@emotion/react`, `@emotion/styled`

- **Utility Libraries:**  
  - `dotenv`, `dotenv-cli`  
  - `@supabase/supabase-js`  
  - `web-ext`, `webextension-polyfill`

- **Chart Visualisation:**  
  - `@visx/gradient`, `@visx/group`, `@visx/mock-data`, `@visx/scale`, `@visx/shape`  
  - `@react-spring/web`

- **Type Definitions:**  
  - `@types/events`, `@types/firefox`, `@types/firefox-webext-browser`

## License

This project is licensed under the [MIT License](LICENSE).

