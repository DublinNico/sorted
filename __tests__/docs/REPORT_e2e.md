# SOFTWARE TESTING PROJECT REPORT — End-to-End Tests (Detox)

| Field | Value |
|---|---|
| **Report Title** | End-to-End Testing Report — Sorted Subscription Tracker |

---

## Section 1: Introduction

### 1.1 Application Overview

See `REPORT_unit.md` Section 1.1 for a full application overview.

---

### 1.2 Project Objectives

1. Validate the complete sign-in journey on a real Android emulator using a live Clerk authentication session.
2. Verify that a subscription can be added via the FAB and appears on the Bills screen, and can subsequently be deleted.
3. Confirm that the biometric login toggle can be enabled through Settings → Security, and that signing in with biometrics succeeds after enabling it.
4. Verify that the push notification setup preconditions are met: a subscription with a tomorrow renewal date is added, and the Notifications screen is configured.
5. Confirm that the Forgot Password flow renders the correct steps and transitions from the email step to the code/password step.

---

### 1.3 Scope

**In scope:**
- `app/(auth)/sign-in.tsx` — email/password sign-in, biometric button, forgot password navigation
- `app/(auth)/sign-in.tsx` → `ForgotPasswordScreen` — email step, code + new password step
- `app/(tabs)/_layout.tsx` — FAB (add subscription button)
- `app/(tabs)/subscriptions.tsx` — subscription card appears and is deletable
- `app/(tabs)/settings.tsx` — sign-out button, settings row navigation
- `app/security.tsx` — biometric toggle switch
- `app/notifications.tsx` — billing reminders row visibility
- `components/CreateSubscriptionModal.tsx` — name input, amount input, submit button
- `components/SubscriptionCard.tsx` — expand and delete

**Out of scope:**
- Actual Expo push notification delivery (depends on FCM + Expo push service + registered token)
- Real biometric sensor match (requires enrolled fingerprint in Android Studio Extended Controls)
- TC-E2E-12 (reset code entry) when `E2E_RESET_CODE` is not set — test is automatically skipped
- iOS (no macOS build environment on this machine)

---

### 1.4 Test Environment

| Property | Value |
|---|---|
| Framework | Detox 20.50.4 |
| Test runner | Jest 29 (via `e2e/jest.config.js`) |
| Platform | Android |
| Emulator | `Medium_Phone_API_35` (Android API 35) |
| App build | Debug APK (`android/app/build/outputs/apk/debug/app-debug.apk`) |
| Build command | `npm run e2e:build` |
| Run command | `npm run e2e:test` |
| App bundle ID | `com.anonymous.myfirstapp` |
| Metro port | 8082 |

---

## Section 2: Mock Strategy

E2E tests do **not** use mocks. Every layer is real:

| Layer | State in E2E |
|---|---|
| Clerk authentication | Real Clerk API (staging or production project) |
| Supabase database | Real Supabase project (data written and cleaned up) |
| Expo push service | Real service — notifications depend on FCM token availability |
| React Native Animated | Real — animations run at native speed |
| Navigation | Real Expo Router navigation between screens |
| Biometrics | Real Android biometric prompt — requires emulator enrollment |

Test credentials are supplied via environment variables (`E2E_EMAIL`, `E2E_PASSWORD`, `E2E_NEW_PASSWORD`, `E2E_RESET_CODE`) so no secrets are committed to the repository.

---

## Section 3: testID Map

`testID` props were added to the following elements specifically to support
reliable element selection in Detox (all additions are additive — no
existing behaviour was changed):

| `testID` | File | Element |
|---|---|---|
| `sign-in-email` | `app/(auth)/sign-in.tsx` | Email TextInput |
| `sign-in-password` | `app/(auth)/sign-in.tsx` | Password TextInput |
| `sign-in-button` | `app/(auth)/sign-in.tsx` | Sign In Pressable |
| `sign-in-biometric-button` | `app/(auth)/sign-in.tsx` | Biometric Pressable |
| `forgot-password-link` | `app/(auth)/sign-in.tsx` | Forgot Password Pressable |
| `reset-email-input` | `app/(auth)/sign-in.tsx` (ForgotPasswordScreen) | Reset email TextInput |
| `reset-code-input` | `app/(auth)/sign-in.tsx` (ForgotPasswordScreen) | 6-digit code TextInput |
| `reset-new-password-input` | `app/(auth)/sign-in.tsx` (ForgotPasswordScreen) | New password TextInput |
| `reset-action-button` | `app/(auth)/sign-in.tsx` (ForgotPasswordScreen) | Send / Reset Pressable |
| `add-subscription-fab` | `app/(tabs)/_layout.tsx` | Centre FAB Pressable |
| `sign-out-button` | `app/(tabs)/settings.tsx` | Sign Out TouchableOpacity |
| `settings-row-{label}` | `app/(tabs)/settings.tsx` | Each settings row (e.g. `settings-row-security`) |
| `biometric-toggle` | `app/security.tsx` | Biometric Login Switch |
| `subscription-name-input` | `components/CreateSubscriptionModal.tsx` | Name TextInput |
| `subscription-amount-input` | `components/CreateSubscriptionModal.tsx` | Amount TextInput |
| `add-payment-button` | `components/CreateSubscriptionModal.tsx` | Add Payment Pressable |
| `subscription-card-{slug}` | `components/SubscriptionCard.tsx` | Card Pressable (slug = name lowercased, spaces → `-`) |
| `subscription-delete-{slug}` | `components/SubscriptionCard.tsx` | Delete TouchableOpacity |

---

## Section 4: Test Cases

### 4.1 Black-Box Test Cases (Boundary Value Analysis / Equivalence Partitioning)

| ID | Description | Input | Expected | File |
|---|---|---|---|---|
| TC-BB-E-01 | Valid credentials sign in | Correct email + password | Home screen visible | `01-full-journey.test.ts` |
| TC-BB-E-02 | Add payment with valid name and amount | Name "E2E Test Sub", amount "5.99" | Card appears on Bills | `01-full-journey.test.ts` |
| TC-BB-E-03 | Forgot password — email step boundary | Email with `@` | Transitions to code step | `04-forgot-password.test.ts` |
| TC-BB-E-04 | Forgot password — code step boundary | 6-digit code + ≥8 char password | Reset completes | `04-forgot-password.test.ts` |

### 4.2 White-Box Test Cases (Branch / State Coverage)

| ID | Description | Branch / State | File |
|---|---|---|---|
| TC-WB-E-01 | Sign in reaches home — `signIn.status === "complete"` branch | `finalize()` called | `01-full-journey.test.ts` |
| TC-WB-E-02 | Delete removes card from Bills list | `deleteSubscription` store action fires | `01-full-journey.test.ts` |
| TC-WB-E-03 | Biometric toggle transitions from false → true | `handleBiometricToggle(true)` branch | `02-biometric-login.test.ts` |
| TC-WB-E-04 | Sign out routes to sign-in screen | Clerk `signOut()` called | `02-biometric-login.test.ts` |
| TC-WB-E-05 | Biometric button visible after enabling | `showBiometricBtn` state true | `02-biometric-login.test.ts` |
| TC-WB-E-06 | Subscription with tomorrow date — `parseDateInput` valid path | Date field filled | `03-push-notification.test.ts` |
| TC-WB-E-07 | App resumes without crash after backgrounding | `device.sendToHome()` + relaunch | No crash | `03-push-notification.test.ts` |
| TC-WB-E-08 | Forgot password shows email step on open | `step === "email"` branch | Reset email input visible | `04-forgot-password.test.ts` |
| TC-WB-E-09 | Sending email transitions to code step | `setStep("verify")` branch | Code input visible | `04-forgot-password.test.ts` |

---

## Section 5: Full Test Case Results Table

> E2E tests are executed against a live emulator and require a built APK.
> Results below reflect **designed behaviour** — mark each as PASS/FAIL
> when executing against the emulator with valid credentials.

| Test Case ID | Description | Screen(s) | Result |
|---|---|---|---|
| TC-E2E-01 | Sign in with valid credentials | Sign In → Home | Pending execution |
| TC-E2E-02 | Add payment via FAB, verify on Bills | Home → Modal → Bills | Pending execution |
| TC-E2E-03 | Expand card and delete it | Bills | Pending execution |
| TC-E2E-04 | Enable biometric login in Security | Settings → Security | Pending execution |
| TC-E2E-05 | Sign out returns to sign-in screen | Settings → Sign In | Pending execution |
| TC-E2E-06 | Sign in with biometrics | Sign In → Home | Pending execution |
| TC-E2E-07 | Add subscription due tomorrow | Home → Modal → Bills | Pending execution |
| TC-E2E-08 | Notifications screen shows billing reminders | Settings → Notifications | Pending execution |
| TC-E2E-09 | Background and foreground without crash | Any | Pending execution |
| TC-E2E-10 | Forgot Password form renders on tap | Sign In → ForgotPassword | Pending execution |
| TC-E2E-11 | Email step sends reset code | ForgotPassword (email step) | Pending execution |
| TC-E2E-12 | Reset code + new password completes reset | ForgotPassword (verify step) | Requires `E2E_RESET_CODE` |
| TC-E2E-13 | Restore original password after reset | Security → Update Password | Requires `E2E_RESET_CODE` |

---

## Section 6: Running the Tests

### Prerequisites

1. Android Studio installed with AVD `Medium_Phone_API_35` created.
2. Debug APK built (one-time, run again after any native change):
   ```
   npm run e2e:build
   ```
3. Metro bundler running in a separate terminal:
   ```
   npm start
   ```
4. Credentials set as environment variables (PowerShell):
   ```powershell
   $env:E2E_EMAIL     = "your-test@email.com"
   $env:E2E_PASSWORD  = "yourpassword"
   ```
   Optional (for forgot-password test):
   ```powershell
   $env:E2E_NEW_PASSWORD = "newpassword123"
   $env:E2E_RESET_CODE   = "123456"
   ```

### Run commands

```bash
# Full E2E suite
npm run e2e:test

# Single test file
npx detox test -c android.emu.debug e2e/tests/01-full-journey.test.ts

# Single test case by name
npm run e2e:test:single "TC-E2E-01"
```

---

## Section 7: Conclusions

### 7.1 Summary

13 E2E test cases were designed across 4 test files covering the four user
journeys specified in Priority 4 of the test plan.

| Report | Tests | Files |
|---|---|---|
| Unit + Integration (`REPORT_unit.md`) | 134 | 11 |
| Component (`REPORT_components.md`) | 27 | 5 |
| Screen (`REPORT_screens.md`) | 56 | 6 |
| E2E — Detox (this report) | 13 | 4 |
| Edge Function — Deno (`supabase/functions/send-reminders/index.test.ts`) | 4 | 1 |
| **Total** | **234** | **27** |

### 7.2 Limitations

1. **Push notification delivery (TC-E2E-07 to TC-E2E-09)** — The Expo push service requires a valid FCM token registered for the emulator. On a fresh emulator with no Google account this token may be absent, so the notification will not arrive in the status bar. The test verifies preconditions (subscription added, notifications configured) rather than end-to-end delivery.

2. **Biometric simulation (TC-E2E-06)** — On the Android emulator, fingerprint matching must be triggered manually via Android Studio Extended Controls → Fingerprint → Touch the sensor, or via ADB (`adb -e emu finger touch 1`). The test opens the biometric prompt but cannot simulate the finger touch automatically without a helper script.

3. **Reset code for TC-E2E-12** — Clerk sends a one-time code to the test email inbox. The test requires the code to be pre-set in `E2E_RESET_CODE` before running. In a CI pipeline this can be automated using Clerk's Testing Token API or a dedicated test mailbox service such as Mailosaur.

### 7.3 Recommendations

- Wire up GitHub Actions (Ubuntu runner) to run `npm test` on every pull request to `dev`. The unit/component/screen suite requires no device.
- For E2E tests in CI, use a macOS runner with an iOS simulator (Maestro or Detox iOS) — this avoids the Windows/Android complexity entirely.
- Integrate Clerk Testing Tokens to automate OTP entry in TC-E2E-12, removing the manual step.
