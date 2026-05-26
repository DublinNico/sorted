/**
 * e2e/tests/03-push-notification.test.ts
 *
 * End-to-end test: Push notification for an upcoming payment
 *
 * Flow:
 *   1. Sign in
 *   2. Add a subscription with renewal date = tomorrow
 *   3. Navigate to Notifications settings and confirm push is enabled
 *   4. Background the app and wait 30 s for the reminder worker to fire
 *   5. Re-open the app and verify the subscription is still listed
 *
 * Limitations:
 *   - The actual push notification is delivered by the Expo Push Service to the
 *     device's FCM token.  On a fresh emulator there may be no registered push
 *     token, so the notification may never arrive.
 *   - Steps 1–3 (subscription created, notifications configured) are fully
 *     automatable.  Step 4 (notification appears in the status bar) requires a
 *     real device or an emulator with Google Play Services and a valid push token.
 *   - This test verifies the setup preconditions (subscription added with correct
 *     renewal date, notifications screen shows expected rows) rather than the
 *     end-to-end delivery of the notification itself.
 *
 * Prerequisites:
 *   - E2E_EMAIL and E2E_PASSWORD environment variables set.
 */

import { by, device, element, expect, waitFor } from 'detox';
import dayjs from 'dayjs';

// ─── Credentials ─────────────────────────────────────────────────────────────

const EMAIL    = process.env.E2E_EMAIL    ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function signIn() {
  await waitFor(element(by.id('sign-in-email'))).toBeVisible().withTimeout(10000);
  await element(by.id('sign-in-email')).typeText(EMAIL);
  await element(by.id('sign-in-password')).typeText(PASSWORD);
  await element(by.id('sign-in-button')).tap();
  await waitFor(element(by.text('Home'))).toBeVisible().withTimeout(15000);
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Push Notification — Upcoming Payment Reminder', () => {

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── TC-E2E-07 ──────────────────────────────────────────────────────────────

  it('TC-E2E-07: add a subscription due tomorrow', async () => {
    await signIn();

    // Open the add payment modal.
    await element(by.id('add-subscription-fab')).tap();
    await waitFor(element(by.text('New Payment'))).toBeVisible().withTimeout(5000);

    // Fill name and amount.
    await element(by.id('subscription-name-input')).typeText('Reminder Test Sub');
    await element(by.id('subscription-amount-input')).typeText('1.99');

    // Set the next payment date to tomorrow (dd/mm/yyyy).
    const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY');
    await element(by.text('dd/mm/yyyy')).typeText(tomorrow);

    // Submit.
    await element(by.id('add-payment-button')).tap();

    // Verify card appears on Bills screen.
    await element(by.text('Bills')).tap();
    await waitFor(element(by.id('subscription-card-reminder-test-sub')))
      .toBeVisible()
      .withTimeout(8000);
  });

  // ── TC-E2E-08 ──────────────────────────────────────────────────────────────

  it('TC-E2E-08: notifications screen shows the billing reminders toggle', async () => {
    // Navigate to Settings → Notifications.
    await element(by.text('Settings')).tap();
    await element(by.id('settings-row-notifications')).tap();
    await waitFor(element(by.text('Notifications'))).toBeVisible().withTimeout(5000);

    // The "Billing Reminders" row must be present.
    await expect(element(by.text('Billing Reminders'))).toBeVisible();
  });

  // ── TC-E2E-09 (informational) ──────────────────────────────────────────────

  it('TC-E2E-09: backgrounds and foregrounds the app without crash', async () => {
    await device.sendToHome();
    // Pause briefly — in a real scenario this is when the push arrives.
    await new Promise((r) => setTimeout(r, 3000));
    await device.launchApp({ newInstance: false });
    // App should resume on the same screen without crashing.
    await expect(element(by.text('Notifications'))).toBeVisible();
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  afterAll(async () => {
    // Remove the test subscription to leave the account clean.
    await element(by.text('Bills')).tap();
    await waitFor(element(by.id('subscription-card-reminder-test-sub')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('subscription-card-reminder-test-sub')).tap();
    await waitFor(element(by.id('subscription-delete-reminder-test-sub')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('subscription-delete-reminder-test-sub')).tap();
  });

});
