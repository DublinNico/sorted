# Testing Types — Coverage vs Gaps

A quick reference of which testing types have been addressed in this project
and which remain outstanding.

---

## Performance Testing

**Status: NOT covered**

No tests measure render time, frame rate, memory usage, bundle size, or
network response latency. The app has not been profiled under any load
condition.

What would be needed:
- React DevTools Profiler or Flashlight to measure render durations on
  target devices
- Measuring time-to-interactive from cold launch on a low-end Android device
- Verifying the subscription list scrolls at 60 fps with a large dataset

---

## Use Case Testing

**Status: PARTIALLY covered (informal)**

The screen tests implicitly exercise several user–system interactions:

| Use Case (informal) | Covered by |
|---|---|
| User signs in with valid credentials | `sign-in.test.tsx` — calls signIn.password |
| User is blocked from signing in with invalid email | `sign-in.test.tsx` — button disabled |
| User creates an account | `sign-up.test.tsx` — calls signUp.create |
| User sees empty state when no subscriptions exist | `home.test.tsx`, `subscriptions.test.tsx`, `insights.test.tsx` |
| User searches for a payment by name | `subscriptions.test.tsx` — search filter |
| User configures notification preferences | `notifications.test.tsx` — all rows present |

However, these are **not formally documented as use cases** with actors,
preconditions, main success flow, alternative flows, and postconditions.
No use case model or use case diagram exists.

What would be needed:
- Formal use case specifications for each user journey
- Test cases derived from both the main success scenario and alternative/
  exception flows (e.g. network offline, session expired, duplicate email)

---

## Sanity Testing

**Status: NOT formally covered**

No dedicated sanity test suite exists. Running `npm test` after each change
acts as a lightweight sanity check (does the app still build and do the 217
automated tests still pass?), but this was not designed as sanity testing and
does not verify the app actually launches and navigates correctly on a device.

What would be needed:
- A short checklist run on a real device after each build: app launches,
  sign-in screen appears, tab bar is reachable, subscriptions list loads
- Could be a Maestro flow of 5–10 steps covering the core screens

---

## Regression Testing

**Status: PARTIALLY covered (automated safety net + E2E flows, not a formal plan)**

The 217 automated unit/component/screen tests act as a regression safety net
— running the suite after any change will catch regressions in units, services,
components, and screens that have been tested. All 217 tests pass on the
current codebase.

In addition, 13 Detox E2E test cases (`e2e/tests/`) cover the four critical
user journeys (sign-in, add/delete subscription, biometric login, password
reset) on a real Android emulator. These catch regressions that mock-based
tests cannot — navigation routing, native auth dialogs, Zustand → UI sync.

However:
- No formal regression test plan or test baseline document exists
- The unit/component/screen suite does not cover all screens or flows, so
  regressions in untested areas (settings screen, tab layout) would not be
  caught automatically
- No CI pipeline is configured to run `npm test` or `detox test` automatically
  on each push

What would be needed:
- CI integration (GitHub Actions) to run `npm test` on every pull request
- A separate CI job (macOS or Linux runner) to run `detox test` on each push
  to `dev` against a pre-built debug APK
- A documented regression baseline listing which builds were verified clean

---

## Stress Testing

**Status: NOT covered**

No tests evaluate behaviour under high load or resource pressure:

- No test seeds a large subscription list (e.g. 500+ items) to check scroll
  performance or store memory usage
- No test simulates rapid repeated interactions (fast tapping, quick
  navigation between tabs)
- No test verifies behaviour under constrained conditions (low memory,
  slow network, airplane mode mid-request)

What would be needed:
- A Detox or Maestro script that adds a large number of subscriptions and
  measures list render time and memory
- Network throttling tests (Expo + Charles Proxy / Android emulator network
  conditions) to verify loading states and error handling under a slow connection

---

## Release Testing

**Status: NOT covered**

No formal release testing process exists. The app has not been:

- Built as a production binary (`.ipa` / `.aab`) and tested on target devices
- Tested against the production Clerk and Supabase environments (all automated
  tests use mocks)
- Verified on the minimum supported OS versions (iOS 16 / Android 10)
- Submitted through Expo Application Services (EAS) build and reviewed on
  TestFlight or Google Play Internal Testing

What would be needed:
- An EAS production build run before each release
- A release checklist covering: sign-in, add subscription, push notification
  opt-in, biometric login, and settings on at least one iOS and one Android
  device
- Smoke test of the live Supabase Edge Function (`send-reminders`) in the
  production project

---

## Summary

| Testing Type | Status | Notes |
|---|---|---|
| Performance | ❌ Not covered | No profiling or load measurement done |
| Use Case | ⚠️ Partial | Implicitly covered by screen tests; no formal use case model |
| Sanity | ❌ Not covered | `npm test` is a proxy but not designed for sanity |
| Regression | ⚠️ Partial | 217-test Jest suite + 13 E2E Detox cases + 4 Deno edge function tests act as safety net; no CI, no formal plan |
| Stress | ❌ Not covered | No high-load or resource-constrained tests |
| Release | ❌ Not covered | No production build, device, or live-environment testing done |
