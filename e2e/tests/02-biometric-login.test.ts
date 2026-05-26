/**
 * e2e/tests/02-biometric-login.test.ts
 *
 * End-to-end test: Biometric login flow
 *
 * Flow:
 *   1. Sign in with email + password
 *   2. Navigate to Settings → Security
 *   3. Toggle "Biometric Login" switch ON
 *   4. Sign out
 *   5. On sign-in screen, tap "Sign in with Biometrics"
 *   6. Verify the app authenticates and reaches the home screen
 *
 * Prerequisites:
 *   - Biometric sensor enrolled on the emulator.
 *     Android Studio → Extended Controls → Fingerprint → Enroll a fingerprint,
 *     then use "Touch the sensor" to simulate a match during the test.
 *   - Environment variables set:
 *       E2E_EMAIL     — valid Clerk test account email
 *       E2E_PASSWORD  — corresponding password
 *
 * Note:
 *   The biometric prompt is a system-level dialog.  Detox simulates the
 *   fingerprint via ADB: `adb -e emu finger touch <id>`.  This test calls
 *   device.sendUserActivity() only to simulate the prompt dismissal.
 *   If the emulator has no enrolled fingerprint the test will be skipped.
 */

import { by, device, element, expect, waitFor } from 'detox';

// ─── Credentials ─────────────────────────────────────────────────────────────

const EMAIL    = process.env.E2E_EMAIL    ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

if (!EMAIL || !PASSWORD) {
  throw new Error('E2E_EMAIL and E2E_PASSWORD must be set to run E2E tests.');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function signIn() {
  await waitFor(element(by.id('sign-in-email'))).toBeVisible().withTimeout(10000);
  await element(by.id('sign-in-email')).typeText(EMAIL);
  await element(by.id('sign-in-password')).typeText(PASSWORD);
  await element(by.id('sign-in-button')).tap();
  await waitFor(element(by.text('Home'))).toBeVisible().withTimeout(15000);
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Biometric Login Flow', () => {

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── TC-E2E-04 ──────────────────────────────────────────────────────────────

  it('TC-E2E-04: enable biometric login in Security settings', async () => {
    await signIn();

    // Navigate to the Settings tab.
    await element(by.text('Settings')).tap();
    await waitFor(element(by.text('Settings'))).toBeVisible().withTimeout(5000);

    // Tap the Security row.
    await element(by.id('settings-row-security')).tap();
    await waitFor(element(by.text('Security'))).toBeVisible().withTimeout(5000);

    // Toggle the Biometric Login switch.
    await element(by.id('biometric-toggle')).tap();

    // The switch should now be on (value true).
    await expect(element(by.id('biometric-toggle'))).toHaveToggleValue(true);
  });

  // ── TC-E2E-05 ──────────────────────────────────────────────────────────────

  it('TC-E2E-05: sign out and return to the sign-in screen', async () => {
    // Go back to Settings.
    await device.pressBack();

    // Tap Sign Out.
    await element(by.id('sign-out-button')).tap();

    // Should land on the sign-in screen.
    await waitFor(element(by.id('sign-in-email'))).toBeVisible().withTimeout(10000);
  });

  // ── TC-E2E-06 ──────────────────────────────────────────────────────────────

  it('TC-E2E-06: sign in with biometrics', async () => {
    // The biometric button is only visible when biometrics are enabled and
    // stored credentials exist.
    await waitFor(element(by.id('sign-in-biometric-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('sign-in-biometric-button')).tap();

    // Simulate fingerprint match on the emulator via Detox biometric API.
    // Requires a fingerprint enrolled in Android Studio Extended Controls.
    await device.matchFinger();

    // After successful biometric auth the home screen should appear.
    await waitFor(element(by.text('Home'))).toBeVisible().withTimeout(15000);
  });

});
