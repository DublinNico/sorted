# Sorted — Ship Checklist

---

## 1. App Identity

- [ ] Change `android.package` in `app.json` from `"com.anonymous.sorted"` to your real package name (e.g. `"com.yourname.sorted"`) — cannot be changed after first Play Store submission
- [ ] Add `ios.bundleIdentifier` to `app.json` if targeting iOS
- [ ] Add `android.backgroundColor: "#0B3D2E"` to `app.json`
- [ ] Confirm `version: "1.0.0"` and add `android.versionCode: 1` to `app.json`
- [ ] Change `userInterfaceStyle` from `"automatic"` to `"dark"` — app has no light mode, automatic will look broken on light-mode phones

---

## 2. Authentication — Clerk

- [ ] Upgrade to a Clerk **Production** instance — current key is `pk_test_` (dev only, applies usage limits)
- [ ] Replace `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in EAS Secrets with the production `pk_live_` key
- [ ] Configure allowed redirect URLs in Clerk dashboard for the production scheme (`sorted://`)

---

## 3. Backend — Supabase

- [ ] Audit Row Level Security (RLS) policies — confirm users can only read and write their own rows
- [ ] Deploy `send-reminders` edge function to the production Supabase project
- [ ] Set up `pg_cron` job in production to invoke `send-reminders` on your chosen schedule
- [ ] Smoke-test the live edge function with a real push token
- [ ] Confirm the `SUPABASE_SERVICE_ROLE_KEY` is stored only in Supabase project secrets and never shipped in the app binary

---

## 4. Environment and Secrets

- [ ] Create `eas.json` with a `production` build profile
- [ ] Move all `.env` values to **EAS Secrets** — secrets must not be baked into the binary
- [ ] Double-check that only `EXPO_PUBLIC_` prefixed keys (anon key, publishable key) are embedded in the build — these are safe to be public

---

## 5. EAS Build

- [ ] Run `eas build --platform android --profile production` and verify the AAB installs and works end-to-end on a real device
- [ ] Sign with a production keystore — back up the keystore file and Expo credentials immediately (losing the keystore means you can never publish an update to the same listing)
- [ ] Run `eas build --platform ios` if targeting the App Store

---

## 6. Pre-launch Testing

- [ ] Install the production build on a real Android device (not Expo Go)
- [ ] Test the full sign-up → add subscription → receive push notification flow against production services
- [ ] Test biometric login on a real device with biometrics enrolled
- [ ] Manually trigger `send-reminders` in production and verify notifications arrive on time
- [ ] Test on at least one low-end device — check scroll performance and memory usage with a large subscription list

---

## 7. Store Listing — Google Play

- [ ] Create app in Google Play Console and complete the store listing (title, short description, full description, category)
- [ ] Upload screenshots — at minimum one phone size, optionally tablet
- [ ] Write a Privacy Policy and host it at a stable public URL — required for all apps that collect user data
- [ ] Complete the content rating questionnaire
- [ ] Fill in the Data Safety section — declare email address and device identifiers (push token) as collected data

---

## 8. Code Cleanup

- [ ] Remove or gate the `splash-preview` dev route so it is not reachable in production
- [ ] Remove or suppress `console.log` / `console.error` calls that are only useful during development

---

## 9. Post-launch

- [ ] Add Sentry (or similar) for crash reporting — PostHog captures events but not native crash traces
- [ ] Set up a GitHub Actions CI job to run `npm test` on every push to `master`
- [ ] Configure EAS Update for OTA JS-only fixes between Play Store reviews
- [ ] Monitor PostHog for drop-off in the sign-up and add-subscription flows after launch

---

## Blockers — must be resolved before any store submission

| # | Blocker |
|---|---|
| 1 | Change `android.package` away from `com.anonymous.sorted` |
| 2 | Switch Clerk to a production instance (`pk_live_` key) |
| 3 | Produce a signed AAB via `eas build` with a backed-up keystore |
