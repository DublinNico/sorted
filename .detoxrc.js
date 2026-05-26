/**
 * .detoxrc.js  —  Detox E2E test configuration
 *
 * Targets the Android emulator (Medium_Phone_API_35) that ships with
 * Android Studio on this machine.  All tests live under e2e/tests/.
 *
 * Before running for the first time:
 *   1. Build the debug APK:
 *        cd android && .\gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug
 *   2. Start Metro in a separate terminal:
 *        npm start
 *   3. Run the full suite:
 *        npx detox test -c android.emu.debug
 *
 * Environment variables used by the tests:
 *   E2E_EMAIL     — test account email
 *   E2E_PASSWORD  — test account password
 *   E2E_NEW_PASSWORD — replacement password used in the forgot-password test
 */

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  // ── App binaries ────────────────────────────────────────────────────────────
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug || gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug',
      // Forward Metro port from emulator to host.
      reversePorts: [8082],
    },
  },

  // ── Device targets ──────────────────────────────────────────────────────────
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        // AVD name from Android Studio (run `emulator -list-avds` to verify).
        avdName: process.env.E2E_AVD_NAME || 'Medium_Phone_API_35',
      },
    },
  },

  // ── Named configurations ────────────────────────────────────────────────────
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
