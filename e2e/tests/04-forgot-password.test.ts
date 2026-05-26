/**
 * e2e/tests/04-forgot-password.test.ts
 *
 * End-to-end test: Forgot password / reset flow
 *
 * Flow:
 *   1. On the sign-in screen, tap "Forgot Password?"
 *   2. Enter the test account email
 *   3. Tap "Send Reset Code" → Clerk sends a 6-digit code by email
 *   4. Enter the code (from E2E_RESET_CODE env var or intercepted via Clerk API)
 *   5. Enter a new password (E2E_NEW_PASSWORD)
 *   6. Tap "Reset Password"
 *   7. Verify redirect back to sign-in, then sign in with the new password
 *   8. Restore original password so the account is usable by other tests
 *
 * Limitations:
 *   - Step 4 requires reading the OTP from an email inbox.  In a real CI
 *     pipeline this is done via Clerk's Testing Tokens API or a dedicated
 *     test mailbox (e.g. Mailosaur).  Locally, set E2E_RESET_CODE to the
 *     code you receive in your inbox before running this test.
 *   - If E2E_RESET_CODE is not set the test is skipped automatically.
 *
 * Prerequisites:
 *   - E2E_EMAIL, E2E_PASSWORD, E2E_NEW_PASSWORD, E2E_RESET_CODE env vars set.
 */

import { by, device, element, expect, waitFor } from 'detox';

// ─── Credentials ─────────────────────────────────────────────────────────────

const EMAIL        = process.env.E2E_EMAIL        ?? '';
const PASSWORD     = process.env.E2E_PASSWORD     ?? '';
const NEW_PASSWORD = process.env.E2E_NEW_PASSWORD ?? '';
const RESET_CODE   = process.env.E2E_RESET_CODE   ?? '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function signIn(email: string, password: string) {
  await waitFor(element(by.id('sign-in-email'))).toBeVisible().withTimeout(10000);
  await element(by.id('sign-in-email')).clearText();
  await element(by.id('sign-in-email')).typeText(email);
  await element(by.id('sign-in-password')).clearText();
  await element(by.id('sign-in-password')).typeText(password);
  await element(by.id('sign-in-button')).tap();
  await waitFor(element(by.text('Home'))).toBeVisible().withTimeout(15000);
}

async function signOut() {
  await element(by.text('Settings')).tap();
  await waitFor(element(by.id('sign-out-button'))).toBeVisible().withTimeout(5000);
  await element(by.id('sign-out-button')).tap();
  await waitFor(element(by.id('sign-in-email'))).toBeVisible().withTimeout(10000);
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Forgot Password Flow', () => {

  // Skip the entire suite if required credentials are not pre-set.
  const skip = !EMAIL || !RESET_CODE || !NEW_PASSWORD;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── TC-E2E-10 ──────────────────────────────────────────────────────────────

  it('TC-E2E-10: tapping Forgot Password shows the reset form', async () => {
    await waitFor(element(by.id('sign-in-email'))).toBeVisible().withTimeout(10000);
    await element(by.id('forgot-password-link')).tap();
    await waitFor(element(by.text('Reset Password'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('reset-email-input'))).toBeVisible();
    await expect(element(by.id('reset-action-button'))).toBeVisible();
  });

  // ── TC-E2E-11 ──────────────────────────────────────────────────────────────

  it('TC-E2E-11: entering the email and requesting a reset code', async () => {
    await element(by.id('reset-email-input')).clearText();
    await element(by.id('reset-email-input')).typeText(EMAIL);
    await element(by.id('reset-action-button')).tap();
    // Screen transitions to the "Check your email" step with the code input.
    await waitFor(element(by.id('reset-code-input'))).toBeVisible().withTimeout(8000);
    await expect(element(by.id('reset-new-password-input'))).toBeVisible();
  });

  // ── TC-E2E-12 ──────────────────────────────────────────────────────────────
  // Skipped if E2E_RESET_CODE or E2E_NEW_PASSWORD are not set.

  it('TC-E2E-12: entering the reset code and setting a new password', async () => {
    if (skip) {
      console.warn(
        'TC-E2E-12 skipped: set E2E_RESET_CODE and E2E_NEW_PASSWORD to run this test.'
      );
      return;
    }

    await element(by.id('reset-code-input')).typeText(RESET_CODE);
    await element(by.id('reset-new-password-input')).typeText(NEW_PASSWORD);
    await element(by.id('reset-action-button')).tap();

    // After a successful reset, Clerk signs the user in and Expo Router
    // redirects to the authenticated area (home screen).
    await waitFor(element(by.text('Home'))).toBeVisible().withTimeout(15000);
  });

  // ── TC-E2E-13 ──────────────────────────────────────────────────────────────

  it('TC-E2E-13: restore original password so the account remains usable', async () => {
    if (skip) return;

    // Sign out, then sign back in with the new password to confirm it works.
    await signOut();
    await signIn(EMAIL, NEW_PASSWORD);

    // Navigate to Security → Change Password and restore the original.
    await element(by.text('Settings')).tap();
    await element(by.id('settings-row-security')).tap();
    await waitFor(element(by.text('Security'))).toBeVisible().withTimeout(5000);

    // Fill current (new) password and restore to original.
    await element(by.text('Current Password')).tap();
    // Use parent sibling matching to find the input next to the label.
    // The PasswordInput component wraps each field in a View; we type into the visible TextInput.
    const currentInput = element(by.label('Current Password').and(by.type('android.widget.EditText')));
    await currentInput.typeText(NEW_PASSWORD);
    const newInput = element(by.label('New Password').and(by.type('android.widget.EditText')));
    await newInput.typeText(PASSWORD);
    await element(by.text('Update Password')).tap();

    // Alert "Password updated" appears.
    await waitFor(element(by.text('Password updated'))).toBeVisible().withTimeout(8000);
    await element(by.text('OK')).tap();
  });

});
