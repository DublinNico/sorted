/**
 * e2e/tests/01-full-journey.test.ts
 *
 * End-to-end test: Full user journey
 *
 * Flow:
 *   1. Launch app → sign in with test credentials
 *   2. Tap the FAB → open "New Payment" modal
 *   3. Fill in name ("E2E Test Sub") and amount ("5.99") → submit
 *   4. Verify the new card appears on the Subscriptions screen
 *   5. Expand the card → tap "Delete Subscription"
 *   6. Verify the card is gone
 *
 * Prerequisites:
 *   - App is built and installed on the emulator (see .detoxrc.js)
 *   - Metro is running: npm start
 *   - Environment variables set:
 *       E2E_EMAIL     — valid Clerk test account email
 *       E2E_PASSWORD  — corresponding password
 */

import { by, device, element, expect, waitFor } from 'detox';

// ─── Credentials (from environment) ─────────────────────────────────────────

const EMAIL    = process.env.E2E_EMAIL    ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * signIn
 * Types credentials into the sign-in form and taps the Sign In button.
 * Waits up to 15 s for the home tab bar to appear before returning.
 */
async function signIn() {
  await waitFor(element(by.id('sign-in-email'))).toBeVisible().withTimeout(10000);
  await element(by.id('sign-in-email')).typeText(EMAIL);
  await element(by.id('sign-in-password')).typeText(PASSWORD);
  await element(by.id('sign-in-button')).tap();
  // Home screen title "Sorted" appears once auth completes.
  await waitFor(element(by.text('Sorted'))).toBeVisible().withTimeout(15000);
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Full User Journey', () => {

  // Fresh app instance for every suite run.
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── TC-E2E-01 ──────────────────────────────────────────────────────────────

  it('TC-E2E-01: sign in with valid credentials and reach the home screen', async () => {
    await signIn();
    // The tab bar label "Home" is always visible once authenticated.
    await expect(element(by.text('Home'))).toBeVisible();
  });

  // ── TC-E2E-02 ──────────────────────────────────────────────────────────────

  it('TC-E2E-02: add a new payment via the FAB and verify it appears in Bills', async () => {
    // Open the "New Payment" bottom sheet via the centre FAB.
    await element(by.id('add-subscription-fab')).tap();
    await waitFor(element(by.text('New Payment'))).toBeVisible().withTimeout(5000);

    // Fill in the name and amount.
    await element(by.id('subscription-name-input')).typeText('E2E Test Sub');
    await element(by.id('subscription-amount-input')).typeText('5.99');

    // Submit.
    await element(by.id('add-payment-button')).tap();

    // Navigate to Bills tab to verify the card was added.
    await element(by.text('Bills')).tap();
    await waitFor(element(by.id('subscription-card-e2e-test-sub')))
      .toBeVisible()
      .withTimeout(8000);
  });

  // ── TC-E2E-03 ──────────────────────────────────────────────────────────────

  it('TC-E2E-03: expand the new payment card and delete it', async () => {
    // Tap the card to expand it.
    await element(by.id('subscription-card-e2e-test-sub')).tap();

    // Delete button is now visible.
    await waitFor(element(by.id('subscription-delete-e2e-test-sub')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('subscription-delete-e2e-test-sub')).tap();

    // Card should be gone.
    await waitFor(element(by.id('subscription-card-e2e-test-sub')))
      .not.toBeVisible()
      .withTimeout(5000);
  });

});
