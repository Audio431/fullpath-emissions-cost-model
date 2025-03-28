Below is the updated README.md with the project components named "cost-model-addon" (for the extension) and "cost-estimation-server" (for the backend):

---

# Privileged Web Extension: Carbon Visualiser [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/blob/main/LICENSE) [![CI](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/CI.yml) [![Dependabot Updates](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/Audio431/FullPath-EnergyEmissions-Cost-Model/actions/workflows/dependabot/dependabot-updates) [![Live Status](https://img.shields.io/endpoint?url=https://fullpath-energyemissions-cost-model.onrender.com/live)](https://fullpath-energyemissions-cost-model.onrender.com/live) [![Backend Uptime](https://img.shields.io/website?down_color=red&up_color=green&url=https://carbon-estimation.betteruptime.com/)](https://carbon-estimation.betteruptime.com/)

**Version:** 1.0.0  
**License:** MIT

## Overview

This browser extension uses experimental API features in Firefox for access metrics and is built with modern web technologies including React, TypeScript, and Webpack. The project leverages Babel for transpilation, Material UI and Emotion for styling, and a suite of tools to streamline development and packaging.

Additionally, a backend service, **cost-estimation-server**, supports the extension from providing data and real-time communication. This component is deployed live; check their statuses below.

---

## cost-model-addon (Browser Extension)

### Requirements

- **Firefox Versions:** Requires Firefox Nightly and Developer Edition  
  (see more details in the [Experimental APIs in Privileged Extensions](https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/basics.html#built-in-versus-experimental-apis))
- **Additional Settings:**  
  In the `about:config` page, set:
  - `xpinstall.signatures.required` to `false`
  - `extensions.experiments.enabled` to `true`
- **Tested Environment:**  
  - Firefox Developer Edition v137.01b  
  - macOS Sequoia v15.3.2

### Installation

1. **Clone the Repository:**

   ```bash
   git clone <repository-url>
   cd cost-model-addon
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

### Available Scripts

| Script                | Command                                                                                                                                          | Description                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **test**              | `echo "Error: no test specified" && exit 1`                                                                                                      | Placeholder for tests (no tests currently specified).                                                               |
| **build**             | `webpack --config webpack.dev.js --mode=development --watch`                                                                                     | Bundles the project in development mode and watches for file changes.                                                 |
| **clean**             | `rm -rf dist`                                                                                                                                    | Cleans the build output by removing the `dist` directory.                                                             |
| **xpi**               | `cd dist && web-ext build --overwrite-dest && mv web-ext-artifacts/carbon_footprint_tracker-1.0.zip web-ext-artifacts/carbon_footprint_tracker-1.0.xpi` | Packages the extension as a Firefox XPI file.                                                                       |
| **build:production**  | `webpack --config webpack.prod.js --mode=production`                                                                                            | Bundles the project for production deployment.                                                                      |

### Development

- **Development Build:**  
  Run `npm run build` to start the development build with webpack in watch mode.
- **Packaging:**  
  After building the project, run `npm run xpi` from the root to generate an XPI package for distribution.
- **Cleaning Up:**  
  To remove previous builds, execute `npm run clean`.

### Key Dependencies

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

---

## cost-estimation-server (Backend Service)

### Overview

The **cost-estimation-server** supports the browser extension by providing necessary APIs and real-time communication features. Built with Node.js, Express, and TypeScript, it is deployed live and its status can be monitored through the provided links.

- **Live Deployment:** [https://fullpath-energyemissions-cost-model.onrender.com/live](https://fullpath-energyemissions-cost-model.onrender.com/live)
- **Monitoring (Better Uptime):** https://carbon-estimation.betteruptime.com/

### Requirements

- **Node.js:** Ensure a compatible Node.js version is installed.
- **Key Dependencies:**
  - **Express:** For handling HTTP requests.
  - **TypeScript:** For type safety and modern JavaScript features.
  - Additional libraries such as `ts-node`, `node-cache`, `winston`, and `ws` (for WebSocket support).

### Installation

1. **Navigate to the Backend Directory:**  
   (If the backend service is in a separate directory, navigate accordingly.)

   ```bash
   cd cost-estimation-server
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

### Available Script

| Script   | Command                                                                                                                                                                    | Description                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **start**| `tsc --noEmit & node --no-warnings=ExperimentalWarning --loader ts-node/esm src/index.ts`                                                                                 | Compiles the TypeScript files (without emitting) and starts the backend service using ts-node and Node.js.     |

### Development

- **Starting the Service:**  
  Run the following command to start the backend service:

  ```bash
  npm start
  ```

- **Testing the Service:**  
  Although no automated tests are currently configured, you can verify the backend functionality by sending HTTP requests (using tools like `curl` or Postman) to the endpoints defined in `src/index.ts`.

---

## License

This project is licensed under the [MIT License](LICENSE).
