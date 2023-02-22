import path from 'path';

import 'colors';
import {defineConfig} from 'cypress';

const synpressPath = path.join(
    process.cwd(),
    '../node_modules/@synthetixio/synpress',
);
console.log(
    `Detected synpress root path is: ${synpressPath}`.green.underline.bold,
);

const pluginsPath = `${synpressPath}/plugins/index`;
console.log(
    `Detected synpress plugin path is: ${pluginsPath}`.yellow.underline.bold,
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupNodeEvents = require(pluginsPath);
const fixturesFolder = `${synpressPath}/fixtures`;
console.log(
    `Detected synpress fixtures path is: ${fixturesFolder}`.gray.underline.bold,
);

const supportFile = 'cypress/support/e2e.ts';

export default defineConfig({
    userAgent: 'synpress',
    retries: {
        runMode: process.env.CI ? 1 : 0,
        openMode: 0,
    },
    fixturesFolder,
    chromeWebSecurity: true,
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: false,
    env: {
        coverage: false,
    },
    defaultCommandTimeout: process.env.SYNDEBUG ? 9999999 : 30000,
    pageLoadTimeout: process.env.SYNDEBUG ? 9999999 : 30000,
    requestTimeout: process.env.SYNDEBUG ? 9999999 : 30000,
    e2e: {
        testIsolation: false,
        setupNodeEvents,
        baseUrl: 'http://localhost:3000',
        specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
        supportFile,
    },
});
