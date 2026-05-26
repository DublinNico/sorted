# Testing TODO

Priorities 1, 2, 3, and 4 are complete (tests written). Coverage sits at approximately **55%** for unit/component/screen tests. E2E tests require a built APK and running emulator to execute.
This document lists everything that still needs to be tested, in priority order.

---

## Priority 1 — Unit Tests (Jest, no device needed)

These can be written immediately using the same setup as the existing tests.

### `store/subscriptionsStore.ts` ✅ Done
- [x] `setSubscriptions` — replaces list
- [x] `addSubscription` — prepends item
- [x] `deleteSubscription` — removes by id
- [x] `updateSubscription` — replaces matching item only
- [x] `setLoading` — flips isLoading flag
- [x] `resetSubscriptions` — clears list and resets isLoading

### `services/subscriptions.ts` (service functions) ✅ Done
- [x] `fetchSubscriptions` — returns mapped array; throws on error
- [x] `createSubscription` — returns saved sub with Supabase UUID; throws on error
- [x] `updateSubscription` — returns updated sub; throws on error
- [x] `deleteSubscription` — resolves void on success; throws on error

### `utils/biometrics.ts` ✅ Done
Requires mocking `expo-secure-store` and `expo-local-authentication`.
- [x] `isBiometricsSupported` — returns false when hardware unavailable
- [x] `isBiometricsEnabled` — reads the KEY_ENABLED flag from SecureStore
- [x] `setBiometricsEnabled` — writes the flag to SecureStore
- [x] `saveCredentials` — writes email and password to SecureStore
- [x] `getStoredCredentials` — returns null when nothing stored; returns object when stored
- [x] `authenticateWithBiometrics` — returns true on success; returns false on failure/cancel

### `services/notificationPrefs.ts` ✅ Done
Requires mocking the Supabase client (same pattern as subscriptions.service.test.ts).
- [x] `getNotificationPrefs` — returns mapped prefs; returns defaults when null; throws on error
- [x] `upsertNotificationPrefs` — resolves void on success; throws on error

### `services/pushTokens.ts` ✅ Done
Requires mocking the Supabase client.
- [x] `upsertPushToken` — resolves void on success; throws on error
- [x] `deletePushToken` — resolves void on success; throws on error

### `utils/notifications.ts` ✅ Done
- [x] `configureNotificationHandler` — registers handler with expo-notifications
- [x] `setupAndroidChannel` — no-op on iOS
- [x] `requestPermissions` — respects existing grants; prompts when undetermined
- [x] `getExpoPushToken` — returns null when denied; returns token string on success; returns null on error

---

## Priority 2 — Component Tests (React Native Testing Library) ✅ Done

`@testing-library/react-native` installed. Tests render the component and assert on what the user sees and can interact with.

### `components/CreateSubscriptionModal.tsx` ✅ Done
- [x] Does not call onSubmit when name or price is empty
- [x] Calls onSubmit when both fields are filled
- [x] Passes name and price in the onSubmit payload
- [x] Selecting a payment type auto-derives the correct category on submit
- [x] Tapping close calls onClose
- [x] Renders "Edit Payment" title when initialData is provided

### `components/SubscriptionCard.tsx` ✅ Done
- [x] Renders name, price, and billing cycle
- [x] Tapping the card calls onPress
- [x] Delete button is not visible when collapsed
- [x] Delete button is visible when expanded
- [x] Tapping delete calls onCancelPress
- [x] Edit button is visible when expanded
- [x] Tapping edit calls onEditPress

### `components/CalendarPicker.tsx` ✅ Done
- [x] Renders current month/year header when visible
- [x] Tapping Today calls onSelect with today's date and calls onClose
- [x] Tapping Clear calls onSelect with "" and calls onClose
- [x] Renders weekday column headers

### `components/UpcommingSubscriptionCard.tsx` ✅ Done
- [x] Renders the subscription name
- [x] Renders the formatted price
- [x] Shows "{n} days left" when daysLeft > 1
- [x] Shows "Last day" when daysLeft is 1

### `components/ListHeading.tsx` ✅ Done
- [x] Renders the title text
- [x] Renders the View all button
- [x] Calling onViewAll when the button is pressed

---

## Priority 3 — Screen Tests (React Native Testing Library) ✅ Done

### `app/(auth)/sign-in.tsx` ✅ Done
- [x] Renders email and password fields on load
- [x] Sign In button is disabled when fields are empty
- [x] Shows error message on failed sign-in
- [x] Biometric button is hidden when biometrics disabled
- [x] Biometric button is visible when biometrics fully enabled
- [x] Biometric button hidden when hardware not supported

### `app/(auth)/sign-up.tsx` ✅ Done
- [x] Renders all four form fields
- [x] Shows password-length error inline when password < 8 chars
- [x] Button disabled when passwords do not match
- [x] Button disabled for invalid email (no dot)
- [x] Calls signUp.create with correctly parsed firstName / lastName
- [x] Calls sendEmailCode after a successful create
- [x] Shows Clerk error on failed create
- [x] Renders verification UI when email verification is pending

### `app/(tabs)/index.tsx` (Home) ✅ Done
- [x] Renders welcome greeting with user's first name
- [x] Falls back to email prefix when firstName is absent
- [x] Shows empty-state messages when store is empty
- [x] Shows subscription name in Due Soon list when a future renewal exists

### `app/(tabs)/subscriptions.tsx` ✅ Done
- [x] Renders "All Payments" title
- [x] Renders search input
- [x] Shows "0 payments" when store is empty
- [x] Shows empty-state message when no subscriptions exist
- [x] Shows singular "1 payment" for exactly one subscription
- [x] Shows plural "N payments" for multiple subscriptions
- [x] Search filters by name; unmatched items disappear

### `app/(tabs)/insights.tsx` ✅ Done
- [x] Renders Insights title, Total Monthly Spending label
- [x] Renders Spending Trend and Category Breakdown sections
- [x] Shows empty-state message when no subscriptions exist
- [x] Renders category name in breakdown legend when subscriptions exist

### `app/notifications.tsx` ✅ Done
- [x] Renders screen title and both section headers
- [x] All six setting row titles are present

---

## Priority 4 — End-to-End Tests (Detox + Android Emulator) ✅ Written

Framework: Detox 20 against `Medium_Phone_API_35` AVD.
Run: `npm run e2e:build` then `npm run e2e:test`

### `e2e/tests/01-full-journey.test.ts` ✅ Written
- [x] TC-E2E-01: sign in with valid credentials and reach the home screen
- [x] TC-E2E-02: add a new payment via the FAB and verify it appears in Bills
- [x] TC-E2E-03: expand the new payment card and delete it

### `e2e/tests/02-biometric-login.test.ts` ✅ Written
- [x] TC-E2E-04: enable biometric login in Security settings
- [x] TC-E2E-05: sign out and return to the sign-in screen
- [x] TC-E2E-06: sign in with biometrics (requires fingerprint enrolled in emulator)

### `e2e/tests/03-push-notification.test.ts` ✅ Written
- [x] TC-E2E-07: add a subscription due tomorrow
- [x] TC-E2E-08: notifications screen shows the billing reminders toggle
- [x] TC-E2E-09: backgrounds and foregrounds the app without crash

### `e2e/tests/04-forgot-password.test.ts` ✅ Written
- [x] TC-E2E-10: tapping Forgot Password shows the reset form
- [x] TC-E2E-11: entering the email and requesting a reset code
- [x] TC-E2E-12: entering the reset code and setting a new password (requires E2E_RESET_CODE)
- [x] TC-E2E-13: restore original password so the account remains usable

---

## Priority 5 — Edge Function Tests (Deno test runner) ✅ Done

File: `supabase/functions/send-reminders/index.ts`
Tests: `supabase/functions/send-reminders/index.test.ts`
Run: `deno test --allow-env supabase/functions/send-reminders/index.test.ts`

- [x] Returns 401 when Authorization header is missing
- [x] Returns 401 when Authorization header does not match service role key
- [x] Sends push notifications for subscriptions due within the configured window
- [x] Correctly parses Expo push ticket responses and counts sent/failed

---

## Coverage Summary

| Layer | Files | Tested | % |
|---|---|---|---|
| Screens | 18 | 6 | ~33% |
| Components | 7 | 5 | ~71% |
| Services | 3 | 3 | 100% |
| Utils | 7 | 4 | ~57% |
| Constants | 4 | 1 (partial) | ~25% |
| Lib | 1 | 1 | 100% |
| Store | 1 | 1 | 100% |
| Context | 1 | 0 | 0% |
| Hooks | 1 | 0 | 0% |
| Edge Function | 1 | 1 | 100% |
| **Total** | **44** | **~23** | **~57%** |

Priorities 1, 2, 3, 4, and 5 are complete. Coverage sits at approximately **57%**.
