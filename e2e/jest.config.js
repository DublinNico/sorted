/**
 * e2e/jest.config.js  —  Jest configuration for Detox E2E tests
 *
 * Kept separate from the root jest config so that `npm test` (unit/component
 * tests) and `npx detox test` (E2E tests) use different environments.
 *
 * Detox 20+ integrates with Jest via the four runner hooks below:
 *   globalSetup       — boots the emulator and installs the APK once
 *   globalTeardown    — shuts the emulator down after all suites finish
 *   testEnvironment   — wraps each test file in a Detox-aware environment
 *   reporters         — pretty-prints pass/fail with Detox metadata
 */

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/tests/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
