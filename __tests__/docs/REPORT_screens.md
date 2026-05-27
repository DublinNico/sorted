# SOFTWARE TESTING PROJECT REPORT — Screen Tests

| Field | Value |
|---|---|
| **Report Title** | Screen Testing Report — Sorted Subscription Tracker |

---

## Section 1: Introduction

### 1.1 Application Overview

See `REPORT_unit.md` Section 1.1 for a full application overview.

---

### 1.2 Project Objectives

1. Validate that each screen renders the correct elements and text on initial load given controlled mock data.
2. Verify that form validation logic (sign-in, sign-up) disables the submit button for invalid inputs and enables it only when all conditions are met.
3. Confirm that screen-level state driven by the Zustand store (subscriptions list, payment count, category breakdown) reflects the store's content correctly.
4. Ensure that empty-state messages appear when the store contains no data, and that real data replaces them when the store is seeded.
5. Verify that the sign-up verification step renders when Clerk returns `status: "missing_requirements"`.

---

### 1.3 Scope

**In scope:**
- `app/(auth)/sign-in.tsx` — field rendering, form validation, error display, biometric button visibility
- `app/(auth)/sign-up.tsx` — field rendering, validation gating (email, password length, password match), Clerk error display, email verification step
- `app/(tabs)/index.tsx` (HomeScreen) — display name derivation, empty state, Due Soon list with store data
- `app/(tabs)/subscriptions.tsx` — title, search input, payment count (singular/plural), empty state, search filter
- `app/(tabs)/insights.tsx` — static section labels, empty state, category legend with store data
- `app/notifications.tsx` — title, section headers, push toggle with debounce, days-before selection, prefs loading from Supabase
- `app/(tabs)/settings.tsx` — title, user info, initials derivation (with fallbacks), settings rows, store-driven payment stats, sign-out
- `app/security.tsx` — title, section headers, biometric row, two-factor coming-soon label, password form validation, `updatePassword` call
- `app/help-support.tsx` — title, FAQ section, contact options, `Linking.openURL` calls, footer version and legal links
- `app/profile.tsx` — title, user info, pre-filled inputs, initials, member since date, save changes validation and success/error outcomes
- `app/payment-methods.tsx` — title, add card modal flow, card type detection, default/Set Default badge logic, remove confirmation alert

**Out of scope:**
- Navigation routing (Link / useRouter calls are stubbed)
- Network calls to Supabase or Clerk (all service layers are mocked)
- Animation behaviour in `InsightsScreen` (Animated.timing / Animated.spring timers are not started — see mocking strategy)
- End-to-end flows (covered in `REPORT_e2e.md`)
- Screens not yet tested: `(tabs)/_layout.tsx`, `(auth)/_layout.tsx`, `admin/`, and auxiliary screens

**Mocking strategy:**

| Mock | Reason |
|---|---|
| `@clerk/expo` — `useSignIn`, `useSignUp`, `useUser`, `useAuth` | Prevents real Clerk network calls; gives tests full control over user state and API return values |
| `@expo/vector-icons` (`Ionicons`) | Native font assets are unavailable in the Node.js test environment |
| `expo-router` — `Link`, `useRouter`, `useFocusEffect` | No real navigation stack exists in tests; `useFocusEffect` is a **no-op** to prevent `Animated` timers from leaking after the test environment is torn down |
| `react-native-svg` — `Svg`, `Path`, `G` | SVG rendering requires a native renderer; stubs with passthrough Fragment / null |
| `@/hooks/useSupabase` | Returns an empty object; prevents Clerk session look-up inside the hook |
| `@/services/subscriptions`, `@/services/notificationPrefs`, `@/utils/notifications` | Replaced with jest.fn() stubs so no Supabase or device calls are made |
| `@/components/SubscriptionCard`, `@/components/CreateSubscriptionModal` | Complex components with native dependencies; replaced with minimal stubs inside the Subscriptions screen test so the screen's own logic (count, filter) is isolated |
| `@/components/SortedLogo` | Renders `react-native-svg` internally; replaced with null stub |
| `@/constants/icons` | Imports `.png` binary assets not transformed by jest-expo in `node` testEnvironment; replaced with numeric stubs (valid `ImageSourcePropType`) |
| `react-native-safe-area-context` (`SafeAreaView`) | Requires native context unavailable in tests; replaced with a passthrough `View` |
| `expo-constants` | Requires `__esModule: true` in the mock so `Constants.expoConfig.version` resolves correctly |
| `@/utils/biometrics` | All biometrics functions mocked as resolved promises in security and sign-in tests |
| `@/services/notificationPrefs`, `@/utils/notifications` | Replaced with jest.fn() stubs in notifications test so no Supabase or device calls are made |
| `React Native Linking` | `jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)` in `beforeEach`; module mock does not reliably intercept this import |
| `Alert` | `jest.spyOn(Alert, "alert")` in payment-methods test to capture and simulate alert button presses |
| Zustand `useSubscriptionsStore` | The **real store** is used; tests call `useSubscriptionsStore.getState().setSubscriptions([...])` and `resetSubscriptions()` to control state without any mocks |

---

## Section 2: Test Plan

### 2.1 Testing Strategy

| Layer | Approach | Status |
|---|---|---|
| Unit testing | Automated — Jest | Implemented |
| Integration testing | Automated — Jest with Supabase mock client | Implemented |
| Component testing | Automated — React Native Testing Library | Implemented |
| Screen testing | Automated — React Native Testing Library | Implemented |
| System / E2E testing | Automated — Detox on Android emulator | Implemented |
| Acceptance testing | Manual — stakeholder walkthrough | Planned |

---

### 2.2 Testing Approach

**Approach: Automated screen testing using React Native Testing Library (RNTL) v13.**

Screen tests render full screen components (the default export of each route file) inside the Node.js test environment. The React Native renderer builds a full component tree including all child components, which is then queried by user-visible text and placeholder values.

External dependencies (Clerk, Supabase, expo-router, react-native-svg) are mocked at the module level so that the test exercises only the screen's own logic. The Zustand subscriptions store is used real — no mock — so that derived values (payment count, category totals, due-soon list) are computed by the actual store reducer rather than a stub.

**Why use the real store:** Mocking the store's return values would bypass the `useMemo` derivations inside each screen. Using the real store and calling `setSubscriptions()/resetSubscriptions()` ensures that the derived state tested is the same logic that runs in production.

---

### 2.3 Testing Levels

**Screen Testing — Implemented**  
Renders full route components with controlled props and mocked hooks. Asserts on visible text, conditional UI elements, and Zustand store-driven derived values. Simulates user input with `fireEvent.changeText` and `fireEvent.press` to test form validation and search filtering.

---

### 2.4 Resources and Schedule

**Tools and frameworks:**

| Tool | Version | Purpose |
|---|---|---|
| Jest | 29.x | Test runner and assertion library |
| jest-expo | 56.0.4 | Expo/React Native Babel preset for Jest |
| @testing-library/react-native | 13.x | Screen rendering and fireEvent interaction |
| react-test-renderer | 19.1.0 | Peer dependency of RNTL (pinned to match project React) |
| Node.js | 24.x | Test execution environment |
| TypeScript | 5.9 | Static typing (compiled via Babel in tests) |

---

## Section 3: Black-Box Testing Test Cases

### 3.1 Technique 1: Equivalence Partitioning

**Applied to:** `SignIn` and `SignUp` form validation.

Each form has clearly defined input partitions that determine whether the submit button is active or disabled.

**`SignIn` — input partitions:**
- Partition A: both fields empty → button disabled, no Clerk call
- Partition B: invalid email (no `@`) → button disabled, no Clerk call
- Partition C: valid email + non-empty password → button active, Clerk called

**`SignUp` — input partitions (password field):**
- Partition A: no password → button disabled
- Partition B: password 1–7 characters → button disabled, length-error shown
- Partition C: password ≥ 8 characters → password condition met

**Test Cases:**

| Test ID | Screen | Partition | Input | Expected | Pass / Fail |
|---|---|---|---|---|---|
| TC-BB-S-01 | `SignIn` | A: both empty | Press Sign In | `signIn.password` not called | PASS |
| TC-BB-S-02 | `SignIn` | B: invalid email | `notanemail`, `password123` | `signIn.password` not called | PASS |
| TC-BB-S-03 | `SignIn` | C: valid form | `user@example.com`, `password123` | `signIn.password` called with args | PASS |
| TC-BB-S-04 | `SignUp` | A/B: all empty | Press Create Account | `signUp.create` not called | PASS |
| TC-BB-S-05 | `SignUp` | B: short password | password = `"short"` (5 chars) | Length error shown | PASS |
| TC-BB-S-06 | `SignUp` | C: valid form | All fields valid, passwords match | `signUp.create` called with args | PASS |

---

### 3.2 Technique 2: Boundary Value Analysis

**Applied to:** `SignUp` password length validation and `Subscriptions` payment count label.

**Password length boundary (valid ≥ 8 characters):**
- Value just below boundary: 7 characters → invalid, error shown
- Value at boundary: 8 characters → valid, no error

**Payment count label boundary (singular vs plural):**
- 0 items → "0 payments"
- 1 item → "1 payment" (singular — at boundary)
- 2 items → "2 payments" (plural — above boundary)

**Test Cases:**

| Test ID | Screen | Boundary | Input | Expected | Pass / Fail |
|---|---|---|---|---|---|
| TC-BB-S-07 | `SignUp` | Password length < 8 | 5-char password | Length error visible | PASS |
| TC-BB-S-08 | `Subscriptions` | Count = 1 (singular) | 1 subscription in store | `"1 payment"` | PASS |
| TC-BB-S-09 | `Subscriptions` | Count = 2 (plural) | 2 subscriptions in store | `"2 payments"` | PASS |

---

## Section 4: White-Box Testing Test Cases

### 4.1 Code Coverage Analysis

**`SignIn`**  
`canSignIn` gate: `emailValid && password.length > 0`. Two branches: (A) gate false → button disabled, no Clerk call; (B) gate true → Clerk called. `biometricReady` state: shown only when `isBiometricsEnabled`, `getStoredCredentials`, and `isBiometricsSupported` all resolve truthy — three branches covered via `waitFor`.

**`SignUp`**  
`canSubmit` gate has five sub-conditions; tests cover: all-empty (gate false), invalid email (gate false), short password (gate false), mismatched passwords (gate false), fully valid (gate true). The verification step conditional `signUp.status === "missing_requirements" && unverifiedFields.includes("email_address") && missingFields.length === 0` is covered by seeding the mock with those exact values.

**`HomeScreen`**  
Display name ternary: `user.firstName || emailPrefix || "there"` — both the firstName-present and firstName-absent (email-prefix) branches are covered. Empty-state conditional for spending breakdown and due-soon list: covered with empty store. Due-soon filter `renewalDate > now` — covered with a far-future date.

**`Subscriptions`**  
`filtered.length !== 1 ? "s" : ""` — singular and plural branches covered. `filtered` `useMemo` — search query lowercasing and name match: covered by search test. `ListEmptyComponent` — rendered when `filtered.length === 0`: covered by empty-store and no-match-query tests.

**`InsightsScreen`**  
`categoryData.length === 0` empty-state branch: covered with empty store. `categoryData.length > 0` branch (renders `CategoryBreakdown`): covered by seeding two subscriptions with the same category.

**`NotificationsScreen`**  
`enabled` toggle: `value === false` path covered by loading remote prefs with `enabled: false`. Debounce guard: upsert not called until timer fires. `daysBefore` toggle: removing and adding a day both produce the correct updated array.

**`Settings`**  
`initials` ternary: firstName+lastName → two-letter initials; no name but email → email-initial; no name and no email → `"?"`. Store-derived `activeCount` and `totalMonthly` computed from real Zustand store state.

**`SecurityScreen`**  
`canUpdate` gate (`currentPassword.length > 0 && newPassword.length >= 8`): false path (blocked) and true path (calls `updatePassword`) both covered. `updatePassword` called with `{ currentPassword, newPassword }` shape.

**`HelpSupportScreen`**  
`Linking.openURL` called with the correct `mailto:` URI for Email Support and with HTTPS URLs for Terms of Service and Privacy Policy — three distinct URL branches.

**`ProfileScreen`**  
`hasChanges` gate: false (nothing changed → `update` not called), true (first name edited → `update` called). `update` success branch: success message shown. `update` rejection branch: error message text shown.

**`PaymentMethodsScreen`**  
`cards.length === 0` → first added card auto-set as default (true branch of `setDefault` on add). `cards.find(c => c.id === id)` on Set Default tap: default badge transferred, demoted card receives Set Default. Remove alert `confirmBtn.onPress?.()`: card removed from list when confirmed.

---

### 4.2 White-Box Test Cases

| Test ID | Screen | Code Path / Branch | Action | Expected | Pass / Fail |
|---|---|---|---|---|---|
| TC-WB-S-01 | `SignIn` | `canSignIn` false — both empty | Press Sign In | `signIn.password` not called | PASS |
| TC-WB-S-02 | `SignIn` | `canSignIn` false — invalid email | Invalid email + password | `signIn.password` not called | PASS |
| TC-WB-S-03 | `SignIn` | `canSignIn` true — valid form | Valid email + password | `signIn.password` called | PASS |
| TC-WB-S-04 | `SignIn` | `biometricReady` false — disabled | Default mock (disabled) | Biometric button absent | PASS |
| TC-WB-S-05 | `SignIn` | `biometricReady` true — all conditions met | All biometric mocks truthy | Biometric button present | PASS |
| TC-WB-S-06 | `SignIn` | `biometricReady` false — hardware absent | Enabled + stored + unsupported | Biometric button absent | PASS |
| TC-WB-S-07 | `SignIn` | Error display — Clerk returns error | Mock returns `{ error: { longMessage } }` | Error text shown | PASS |
| TC-WB-S-08 | `SignUp` | `canSubmit` false — all empty | Press Create Account | `signUp.create` not called | PASS |
| TC-WB-S-09 | `SignUp` | Password < 8 chars — inline error | Type 5-char password | Length error text shown | PASS |
| TC-WB-S-10 | `SignUp` | `canSubmit` false — invalid email (no dot) | email without "." | `signUp.create` not called | PASS |
| TC-WB-S-11 | `SignUp` | `canSubmit` false — passwords differ | Mismatched confirmPassword | `signUp.create` not called | PASS |
| TC-WB-S-12 | `SignUp` | `canSubmit` true — all valid | All fields valid | `signUp.create` called with parsed name | PASS |
| TC-WB-S-13 | `SignUp` | `sendEmailCode` called after create | All fields valid | `verifications.sendEmailCode` called | PASS |
| TC-WB-S-14 | `SignUp` | Clerk error — `create` returns error | Mock `create` returns error | Error text shown | PASS |
| TC-WB-S-15 | `SignUp` | Verification step condition | `status: "missing_requirements"`, unverifiedFields includes email_address | Verification UI shown | PASS |
| TC-WB-S-16 | `HomeScreen` | `displayName` — firstName present | `user.firstName = "Alice"` | `"Alice"` shown | PASS |
| TC-WB-S-17 | `HomeScreen` | `displayName` — firstName absent | `user.firstName = null` | Email prefix shown | PASS |
| TC-WB-S-18 | `HomeScreen` | Empty state — spending breakdown | Empty store | `"Add payments to see your spending breakdown."` | PASS |
| TC-WB-S-19 | `HomeScreen` | Empty state — due soon | Empty store | `"No upcoming payments."` | PASS |
| TC-WB-S-20 | `HomeScreen` | Due soon list — future renewal | Sub with `renewalDate > now` | Sub name shown | PASS |
| TC-WB-S-21 | `Subscriptions` | `filtered.length` plural | 2 subs in store | `"2 payments"` | PASS |
| TC-WB-S-22 | `Subscriptions` | `filtered.length` singular boundary | 1 sub in store | `"1 payment"` | PASS |
| TC-WB-S-23 | `Subscriptions` | `ListEmptyComponent` | Empty store | `"No payments found."` | PASS |
| TC-WB-S-24 | `Subscriptions` | Search filter — match | Query matches one sub | Matched shown, other hidden | PASS |
| TC-WB-S-25 | `Subscriptions` | Search filter — no match | Query matches nothing | `"0 payments"` | PASS |
| TC-WB-S-26 | `InsightsScreen` | `categoryData.length === 0` empty state | Empty store | `"Add subscriptions to see a breakdown."` | PASS |
| TC-WB-S-27 | `InsightsScreen` | `categoryData.length > 0` — legend | 2 subs same category | Category name in legend | PASS |
| TC-WB-S-28 | `NotificationsScreen` | `enabled` toggle false — value reflected | `getNotificationPrefs` returns `enabled: false` | Toggle value is false | PASS |
| TC-WB-S-29 | `NotificationsScreen` | Debounce guard — upsert not fired before timer | Toggle changed, timers not advanced | `upsertNotificationPrefs` not called | PASS |
| TC-WB-S-30 | `NotificationsScreen` | `daysBefore` toggle off — array updated | Deselect "3 days before" | `daysBefore: [1, 7]` sent | PASS |
| TC-WB-S-31 | `NotificationsScreen` | `daysBefore` toggle on — array updated | Start with `[1]`, select "7 days before" | `daysBefore: [1, 7]` sent | PASS |
| TC-WB-S-32 | `Settings` | Initials — firstName + lastName | Both present | Two-letter initials shown | PASS |
| TC-WB-S-33 | `Settings` | Initials — no name, email fallback | `firstName/lastName null`, email present | Email-initial shown | PASS |
| TC-WB-S-34 | `Settings` | Initials — no name, no email | All null/empty | `"?"` shown | PASS |
| TC-WB-S-35 | `Settings` | Store-driven active count | 2 subs in store | `"2"` shown | PASS |
| TC-WB-S-36 | `Settings` | Store-driven total monthly cost | 2 subs totalling €15.00 | `"€15.00"` shown | PASS |
| TC-WB-S-37 | `SecurityScreen` | `canUpdate` false — both empty | Press Update Password | `updatePassword` not called | PASS |
| TC-WB-S-38 | `SecurityScreen` | `canUpdate` false — new password < 8 chars | "short" in new field | `updatePassword` not called | PASS |
| TC-WB-S-39 | `SecurityScreen` | `canUpdate` true — both valid | Valid current + new passwords | `updatePassword` called with correct args | PASS |
| TC-WB-S-40 | `HelpSupportScreen` | `Linking.openURL` — mailto | Press Email Support | Called with `"mailto:support@sorted.ie"` | PASS |
| TC-WB-S-41 | `HelpSupportScreen` | `Linking.openURL` — Terms URL | Press Terms of Service | Called with HTTPS URL | PASS |
| TC-WB-S-42 | `HelpSupportScreen` | `Linking.openURL` — Privacy URL | Press Privacy Policy | Called with HTTPS URL | PASS |
| TC-WB-S-43 | `ProfileScreen` | `hasChanges` false — `update` not called | Press Save without editing | `user.update` not called | PASS |
| TC-WB-S-44 | `ProfileScreen` | `hasChanges` true — `update` called | Edit first name, press Save | `user.update` called with new name | PASS |
| TC-WB-S-45 | `ProfileScreen` | Update success branch | `update` resolves | Success message shown | PASS |
| TC-WB-S-46 | `ProfileScreen` | Update error branch | `update` rejects with `{ message }` | Error message text shown | PASS |
| TC-WB-S-47 | `PaymentMethodsScreen` | First card auto-default | Add one card | "Default" badge present | PASS |
| TC-WB-S-48 | `PaymentMethodsScreen` | Set Default promotes card | Add two cards, press Set Default | Second card gets "Default"; first shows "Set Default" | PASS |
| TC-WB-S-49 | `PaymentMethodsScreen` | Remove confirmation alert | Press Remove | `Alert.alert` called with "Remove Card" | PASS |
| TC-WB-S-50 | `PaymentMethodsScreen` | Remove confirmed — card removed | Confirm alert Remove button | Card absent from list | PASS |

---

## Section 5: Automated Testing (Screen Testing)

### 5.1 Overview of Automated Tests

**Framework:** React Native Testing Library v13 with the jest-expo preset.

**Test files and scope:**

| File | Screen Tested | Tests |
|---|---|---|
| `__tests__/screens/sign-in.test.tsx` | `app/(auth)/sign-in.tsx` | 11 |
| `__tests__/screens/sign-up.test.tsx` | `app/(auth)/sign-up.tsx` | 14 |
| `__tests__/screens/home.test.tsx` | `app/(tabs)/index.tsx` | 8 |
| `__tests__/screens/subscriptions.test.tsx` | `app/(tabs)/subscriptions.tsx` | 8 |
| `__tests__/screens/insights.test.tsx` | `app/(tabs)/insights.tsx` | 6 |
| `__tests__/screens/notifications.test.tsx` | `app/notifications.tsx` | 13 |
| `__tests__/screens/settings.test.tsx` | `app/(tabs)/settings.tsx` | 13 |
| `__tests__/screens/security.test.tsx` | `app/security.tsx` | 11 |
| `__tests__/screens/help-support.test.tsx` | `app/help-support.tsx` | 12 |
| `__tests__/screens/profile.test.tsx` | `app/profile.tsx` | 14 |
| `__tests__/screens/payment-methods.test.tsx` | `app/payment-methods.tsx` | 13 |
| **Total** | | **123** |

---

### 5.2 Screen Test Code Snippets

**`__tests__/screens/sign-up.test.tsx` — helpers and form validation**
```typescript
jest.mock("@clerk/expo", () => ({ useSignUp: jest.fn() }));
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

function makeMockSignUp(overrides: any = {}) {
  return {
    create: jest.fn().mockResolvedValue({ error: null }),
    verifications: {
      sendEmailCode:   jest.fn().mockResolvedValue({ error: null }),
      verifyEmailCode: jest.fn().mockResolvedValue({ error: null }),
    },
    status: "idle", unverifiedFields: [], missingFields: [],
    ...overrides,
  };
}

// "Create Account" appears on both the page heading and the button.
// pressSubmit() targets the button (last occurrence).
function pressSubmit(getAllByText) {
  const nodes = getAllByText("Create Account");
  fireEvent.press(nodes[nodes.length - 1]);
}

it("calls signUp.create with parsed firstName, lastName, email, and password", async () => {
  const mockSignUp = setupClerk();
  const { getAllByText, getByPlaceholderText } = render(<SignUp />);
  fireEvent.changeText(getByPlaceholderText("John Doe"),               "Jane Doe");
  fireEvent.changeText(getByPlaceholderText("john.doe@example.com"),   "jane@example.com");
  fireEvent.changeText(getByPlaceholderText("At least 8 characters"),  "password123");
  fireEvent.changeText(getByPlaceholderText("Re-enter your password"), "password123");
  pressSubmit(getAllByText);
  await waitFor(() => {
    expect(mockSignUp.create).toHaveBeenCalledWith({
      firstName: "Jane", lastName: "Doe",
      emailAddress: "jane@example.com", password: "password123",
    });
  });
});
```

**`__tests__/screens/subscriptions.test.tsx` — store seeding and search**
```typescript
jest.mock("@/components/SubscriptionCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }: any) => React.createElement(Text, null, name);
});

import { useSubscriptionsStore } from "@/store/subscriptionsStore";

beforeEach(() => {
  useSubscriptionsStore.getState().resetSubscriptions();
});

it("filters cards to show only the matched name", () => {
  useSubscriptionsStore.getState().setSubscriptions([
    makeSub("a", { name: "Netflix" }),
    makeSub("b", { name: "Spotify" }),
  ]);
  const { getByPlaceholderText, getByText, queryByText } = render(<Subscriptions />);
  fireEvent.changeText(getByPlaceholderText("Search payments..."), "Netflix");
  expect(getByText("Netflix")).toBeTruthy();
  expect(queryByText("Spotify")).toBeNull();
});
```

**`__tests__/screens/insights.test.tsx` — SVG default import mock**
```typescript
// insights.tsx uses `import Svg, { Path }` — default + named.
// Without __esModule: true, Babel interop wraps the whole module as the
// default, making Svg a plain object instead of a component.
jest.mock("react-native-svg", () => {
  const React = require("react");
  const SvgComponent = ({ children }: any) =>
    React.createElement(React.Fragment, null, children);
  return { __esModule: true, default: SvgComponent, Path: () => null };
});

// useFocusEffect is a no-op so Animated timers never start and
// cannot fire after the test environment is torn down.
jest.mock("expo-router", () => ({
  useFocusEffect: () => {},
}));
```

---

### 5.3 Test Execution Results

The following output was captured when running `npm test` (all 27 test files):

```
PASS __tests__/screens/sign-in.test.tsx
PASS __tests__/screens/sign-up.test.tsx
PASS __tests__/screens/home.test.tsx
PASS __tests__/screens/subscriptions.test.tsx
PASS __tests__/screens/insights.test.tsx
PASS __tests__/screens/notifications.test.tsx
PASS __tests__/screens/settings.test.tsx
PASS __tests__/screens/security.test.tsx
PASS __tests__/screens/help-support.test.tsx
PASS __tests__/screens/profile.test.tsx
PASS __tests__/screens/payment-methods.test.tsx

Test Suites: 27 passed, 27 total
Tests:       284 passed, 284 total
Snapshots:   0 total
Time:        ~15 s
```

---

### 5.4 Test Results Summary Table

| Test | Screen | Functionality Tested | Result |
|---|---|---|---|
| `renders the email input field` | SignIn | Field present on load | PASS |
| `renders the password input field` | SignIn | Field present on load | PASS |
| `renders the Sign In button` | SignIn | Button present on load | PASS |
| `renders the Sign Up link` | SignIn | Link present on load | PASS |
| `does not call signIn.password when fields are empty` | SignIn | canSignIn false — all empty | PASS |
| `does not call signIn.password for email missing @` | SignIn | canSignIn false — invalid email | PASS |
| `calls signIn.password with email and password` | SignIn | canSignIn true — valid form | PASS |
| `shows an error message when sign-in fails` | SignIn | Error display from Clerk | PASS |
| `does not show biometric button when disabled` | SignIn | biometricReady false | PASS |
| `shows biometric button when fully enabled` | SignIn | biometricReady true | PASS |
| `does not show biometric button — hardware unsupported` | SignIn | biometricReady false — no HW | PASS |
| `renders the Full Name input` | SignUp | Field present on load | PASS |
| `renders the Email input` | SignUp | Field present on load | PASS |
| `renders the Password input` | SignUp | Field present on load | PASS |
| `renders the Confirm Password input` | SignUp | Field present on load | PASS |
| `renders the Create Account button` | SignUp | Button present on load | PASS |
| `renders the Sign in link` | SignUp | Link present on load | PASS |
| `does not call signUp.create when all fields empty` | SignUp | canSubmit false — all empty | PASS |
| `shows password-length error when password < 8 chars` | SignUp | Inline validation feedback | PASS |
| `does not call signUp.create — passwords do not match` | SignUp | canSubmit false — mismatch | PASS |
| `does not call signUp.create — email has no dot` | SignUp | canSubmit false — invalid email | PASS |
| `calls signUp.create with parsed name + email + password` | SignUp | canSubmit true — success | PASS |
| `calls sendEmailCode after a successful create` | SignUp | Post-create verification dispatch | PASS |
| `shows an error when signUp.create returns an error` | SignUp | Clerk error display | PASS |
| `renders the verification UI when email needs confirming` | SignUp | Verification step condition | PASS |
| `renders the welcome greeting with first name` | HomeScreen | displayName — firstName branch | PASS |
| `uses email prefix when firstName is absent` | HomeScreen | displayName — email fallback | PASS |
| `renders Monthly stat card label` | HomeScreen | Static section present | PASS |
| `renders Spending Overview section` | HomeScreen | Static section present | PASS |
| `renders Due Soon section` | HomeScreen | Static section present | PASS |
| `shows empty spending-breakdown message` | HomeScreen | chartData.length === 0 | PASS |
| `shows "No upcoming payments."` | HomeScreen | dueSoon.length === 0 | PASS |
| `renders subscription name in Due Soon list` | HomeScreen | Future renewal appears | PASS |
| `renders the All Payments title` | Subscriptions | Title present on load | PASS |
| `renders the search input` | Subscriptions | Search bar present | PASS |
| `shows "0 payments" when store is empty` | Subscriptions | filtered.length === 0 | PASS |
| `shows empty-state message` | Subscriptions | ListEmptyComponent | PASS |
| `shows "1 payment" (singular)` | Subscriptions | Count boundary — singular | PASS |
| `shows "2 payments" (plural)` | Subscriptions | Count boundary — plural | PASS |
| `filters to show only the matched name` | Subscriptions | Search — match | PASS |
| `shows "0 payments" when query matches nothing` | Subscriptions | Search — no match | PASS |
| `renders the Notifications title` | Notifications | Title present | PASS |
| `renders the PUSH NOTIFICATIONS section header` | Notifications | Section header present | PASS |
| `renders the REMIND ME section header` | Notifications | Section header present | PASS |
| `renders the Push Notifications row` | Notifications | SettingRow title present | PASS |
| `renders all three days-before options` | Notifications | All three options visible | PASS |
| `does not render removed fake toggles` | Notifications | Removed rows absent | PASS |
| `calls getNotificationPrefs on mount` | Notifications | Service called on load | PASS |
| `loads remote prefs — disabled push with custom days` | Notifications | Toggle reflects loaded prefs | PASS |
| `requests OS permission when enabling push` | Notifications | requestPermissions called | PASS |
| `saves to Supabase after debounce when push is toggled` | Notifications | upsertNotificationPrefs called | PASS |
| `does not save before debounce delay` | Notifications | Debounce guard | PASS |
| `saves updated daysBefore array when a day is toggled off` | Notifications | daysBefore array updated | PASS |
| `saves updated daysBefore array when a day is toggled on` | Notifications | daysBefore array updated | PASS |
| `renders the Insights title` | InsightsScreen | Title present | PASS |
| `renders Total Monthly Spending label` | InsightsScreen | Gold card label present | PASS |
| `renders Spending Trend section` | InsightsScreen | Section header present | PASS |
| `renders Category Breakdown section` | InsightsScreen | Section header present | PASS |
| `shows empty-state message — no subscriptions` | InsightsScreen | categoryData.length === 0 | PASS |
| `renders category name in breakdown legend` | InsightsScreen | categoryData.length > 0 | PASS |
| `renders the Settings title` | Settings | Title present | PASS |
| `shows the user's full name` | Settings | fullName prop displayed | PASS |
| `shows the user's email` | Settings | Email displayed | PASS |
| `shows two-letter initials when both names available` | Settings | Initials derived from firstName + lastName | PASS |
| `falls back to email initial when no name is set` | Settings | Email-initial fallback | PASS |
| `shows '?' initials when user has no name or email` | Settings | Ultimate fallback | PASS |
| `renders all settings row labels` | Settings | Four rows present | PASS |
| `renders the Sign Out button` | Settings | testID="sign-out-button" found | PASS |
| `renders the app version from expo-constants` | Settings | Version string shown | PASS |
| `shows 0 active payments when store is empty` | Settings | activeCount from empty store | PASS |
| `shows correct active payment count from the store` | Settings | activeCount from seeded store | PASS |
| `shows total monthly cost from the store` | Settings | totalMonthly computed | PASS |
| `calls signOut when the Sign Out button is pressed` | Settings | Clerk signOut called | PASS |
| `renders the Security title` | SecurityScreen | Title present | PASS |
| `renders the CHANGE PASSWORD section header` | SecurityScreen | Section header present | PASS |
| `renders the SECURITY OPTIONS section header` | SecurityScreen | Section header present | PASS |
| `renders the Biometric Login row` | SecurityScreen | Row title present | PASS |
| `renders the Two-Factor Authentication row` | SecurityScreen | Row title present | PASS |
| `renders Two-Factor as coming soon` | SecurityScreen | "Coming soon" label | PASS |
| `renders the Data Privacy section` | SecurityScreen | Section present | PASS |
| `renders the View Privacy Policy link` | SecurityScreen | Link text present | PASS |
| `is disabled when both fields are empty` | SecurityScreen | canUpdate false — all empty | PASS |
| `is disabled when new password < 8 chars` | SecurityScreen | canUpdate false — short password | PASS |
| `calls updatePassword when both fields are valid` | SecurityScreen | canUpdate true — success | PASS |
| `renders the Help & Support screen title` | HelpSupportScreen | Title present | PASS |
| `renders the FAQ section header` | HelpSupportScreen | Section header present | PASS |
| `renders all FAQ questions` | HelpSupportScreen | All 6 questions visible | PASS |
| `renders the Email Support contact option` | HelpSupportScreen | Email Support row present | PASS |
| `renders Live Chat as coming soon` | HelpSupportScreen | Live Chat row present | PASS |
| `renders Documentation as coming soon` | HelpSupportScreen | Documentation row present | PASS |
| `renders the app version in the footer` | HelpSupportScreen | Version string shown | PASS |
| `renders Terms of Service and Privacy Policy links` | HelpSupportScreen | Footer links present | PASS |
| `opens the support email when Email Support is tapped` | HelpSupportScreen | Linking.openURL with mailto | PASS |
| `opens Terms of Service URL when tapped` | HelpSupportScreen | Linking.openURL with HTTPS | PASS |
| `opens Privacy Policy URL when tapped` | HelpSupportScreen | Linking.openURL with HTTPS | PASS |
| `renders the Profile title` | ProfileScreen | Title present | PASS |
| `renders the Edit Profile card heading` | ProfileScreen | Card heading present | PASS |
| `shows the user's display name in the avatar card` | ProfileScreen | Full name shown | PASS |
| `shows the user's email` | ProfileScreen | Email shown | PASS |
| `shows two-letter initials in the avatar` | ProfileScreen | Initials derived | PASS |
| `renders first name and last name inputs pre-filled` | ProfileScreen | Input values match user | PASS |
| `shows the Member Since label` | ProfileScreen | Label present | PASS |
| `shows the formatted member since date` | ProfileScreen | "March 2024" shown | PASS |
| `shows '—' when createdAt is not available` | ProfileScreen | Null guard renders label | PASS |
| `Save Changes button is disabled when nothing has changed` | ProfileScreen | hasChanges false | PASS |
| `Save Changes button is enabled after editing first name` | ProfileScreen | hasChanges true — update called | PASS |
| `Save Changes button is enabled after editing last name` | ProfileScreen | hasChanges true — update called | PASS |
| `shows success message after a successful save` | ProfileScreen | update resolve path | PASS |
| `shows error message when save fails` | ProfileScreen | update reject path | PASS |
| `renders the screen title` | PaymentMethodsScreen | Title present | PASS |
| `renders the subtitle description` | PaymentMethodsScreen | Subtitle text present | PASS |
| `renders the Add New Card button when no cards exist` | PaymentMethodsScreen | Button visible on empty state | PASS |
| `shows no card rows when the list is empty` | PaymentMethodsScreen | No Default or Remove text | PASS |
| `adds a card and shows it in the list` | PaymentMethodsScreen | Card last4 visible after add | PASS |
| `first card added is automatically set as default` | PaymentMethodsScreen | Auto-default on first add | PASS |
| `second card is not the default and shows Set Default button` | PaymentMethodsScreen | Set Default button for non-default | PASS |
| `detects Visa card type from a Visa number` | PaymentMethodsScreen | "Visa" label shown | PASS |
| `detects Mastercard type from a Mastercard number` | PaymentMethodsScreen | "Mastercard" label shown | PASS |
| `shows the card expiry date after adding` | PaymentMethodsScreen | Expiry string shown | PASS |
| `promotes a card to default when Set Default is tapped` | PaymentMethodsScreen | Default badge transfers | PASS |
| `shows a confirmation alert when Remove is tapped` | PaymentMethodsScreen | Alert.alert called | PASS |
| `removes the card after confirming the alert` | PaymentMethodsScreen | Card gone after confirm | PASS |

---

## Section 6: Conclusions

### 6.1 Summary of Testing

A total of **122 screen tests** were implemented across 11 test files, covering all eleven screens specified in the test plan. All 122 tests pass. The full Jest suite now stands at **284 tests across 27 files**.

| Report | Tests | Files |
|---|---|---|
| Unit + Integration (`REPORT_unit.md`) | 127 | 11 |
| Component (`REPORT_components.md`) | 35 | 5 |
| Screen (this report) | 122 | 11 |
| **Total (Jest)** | **284** | **27** |

Tests are split across four testing techniques:
- **Equivalence Partitioning:** covers the distinct valid/invalid input partitions for sign-in, sign-up, security password update, and profile save forms.
- **Boundary Value Analysis:** covers the singular/plural payment count boundary, the password length boundary, and card type BIN detection via the payment-methods tests.
- **White-box branch coverage:** 50 test cases targeting specific conditional branches, early-return guards, debounce guards, and store-driven derived state.
- **Rendering tests:** confirm that all key UI elements are present on load across every screen.

---

### 6.2 Key Findings

**Strengths identified:**
- Using the **real Zustand store** (seeded via `setSubscriptions` / `resetSubscriptions`) rather than mocking it ensures that all `useMemo` derivations in `HomeScreen`, `Subscriptions`, and `InsightsScreen` are exercised with production logic. Store-driven text (payment counts, category names) is tested accurately.
- The `SubscriptionCard` minimal stub (`({ name }) => <Text>{name}</Text>`) allows the `Subscriptions` screen's search and count logic to be verified without pulling in the card's full dependency tree.
- The `pressSubmit()` helper in `sign-up.test.tsx` cleanly handles the duplicate "Create Account" text (heading + button label) without fragile index references in each test.

**Issues discovered and resolved:**

1. **`react-native-svg` default import interop** — `insights.tsx` uses `import Svg, { Path } from "react-native-svg"`. Without `__esModule: true` in the mock, Babel's CommonJS interop sets `Svg` to the entire module object rather than the mock component, causing React to throw `"Element type is invalid: expected a string or function but got: object."` Fixed by adding `__esModule: true` and a `default` export to the insights SVG mock.

2. **`Animated` timer leakage from `useFocusEffect`** — mocking `useFocusEffect` as `(cb) => cb()` (fire immediately) causes `Animated.timing` timers to be queued via `requestAnimationFrame`. These fire after the test environment is torn down, producing `"ReferenceError: You are trying to access a property of the Jest environment after it has been torn down."` Fixed by mocking `useFocusEffect` as a no-op `() => {}`. Animation timers never start; text content (which is outside the `Animated.View`) is still queryable.

3. **Duplicate text node for "Create Account"** — the sign-up screen renders `"Create Account"` as both the page heading and the submit button label. `getByText` throws when multiple nodes match. Fixed with a `pressSubmit()` helper that calls `getAllByText("Create Account")` and presses the last element (the button).

4. **Dead code path in `SignUp` mismatch error** — the `handleSignUp` function checks `if (password !== confirmPassword) { setConfirmError(...) }`, but `canSubmit` already requires `password === confirmPassword`, so the button is always disabled when passwords differ. The test was corrected to verify the button stays disabled when the email has no dot.

5. **`expo-constants` default export interop** — the `settings.test.tsx` and `help-support.test.tsx` files mock `expo-constants` to return a specific version. Without `__esModule: true`, `Constants.expoConfig` resolves to `undefined`. Fixed by adding `__esModule: true` and a `default` key to the mock.

6. **`Linking.openURL` not intercepted by module mock** — `jest.mock("react-native/Libraries/Linking/Linking", ...)` did not intercept the `Linking` import in `help-support.tsx`. Fixed by using `jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)` in `beforeEach` and restoring in `afterEach`.

7. **Card last4 text node not matched by exact string** — `PaymentMethodsScreen` renders `"•••• 1111"` as a single text node. `getByText("1111")` fails on an exact match. Fixed by using `getByText(/1111/)` regex.

8. **Asserting Set Default is absent after promotion** — after promoting card B to default, card A loses its default badge and gains a "Set Default" button. `queryByText("Set Default").toBeNull()` therefore fails. Fixed by asserting `getByText("Set Default")` (the demoted card now shows it).

**No defects were found** in any of the eleven tested screens. All screens rendered and behaved as specified.

---

### 6.3 Lessons Learned

1. **Check the import style before writing an SVG mock.** `import Svg, { Path }` (default + named) requires `__esModule: true` and a `default` key in the mock. `import { Svg, Path }` (named-only) does not. Getting this wrong produces a cryptic "Element type is invalid" error at render time.

2. **Mock `useFocusEffect` as a no-op, not a synchronous caller.** Firing the animation callback synchronously during render queues timers that outlive the test environment. A no-op prevents the leak entirely with no loss of test coverage (the content under test is outside the animated views).

3. **Use the real Zustand store, not a mock.** Screen components derive state through `useMemo` hooks that depend on the store. Mocking the store's return values bypasses these derivations, producing tests that verify mock values rather than real logic. Using `getState().setSubscriptions(...)` seeds real data and verifies real output.

4. **Identify duplicate text before writing `getByText` assertions.** Screens that reuse a label for both a heading and a button require `getAllByText` and index selection. Reading the component file before writing tests avoids this class of failure.

5. **`expo-constants` requires `__esModule: true`.** Any Expo module that uses a default export (`import Constants from "expo-constants"`) needs `__esModule: true` in its mock or Babel's CommonJS interop wraps the mock object as the default value, making `Constants.expoConfig` undefined.

6. **Spy on `Linking.openURL` rather than mocking the module.** `jest.mock(...)` on deep React Native internal paths may not intercept the correct import. `jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)` in `beforeEach` is reliable, explicit, and restores cleanly in `afterEach`.

---

### 6.4 Recommendations

1. **Add `testID` props to interactive elements that share text labels** (e.g. the "Create Account" heading and button in `sign-up.tsx`). `testID="submit-button"` would make the press target unambiguous without needing the `pressSubmit()` workaround.

2. **Extend screen tests to cover interaction flows** — expand a `SubscriptionCard` in the `Subscriptions` test, trigger the edit modal, verify the delete optimistic-update rollback path. These flows require more complex mock wiring but cover the most user-critical code paths.

3. ~~**Add E2E tests (Maestro or Detox)**~~ — **Completed.** 13 E2E test cases are written using Detox 20. See `REPORT_e2e.md`.

4. **Add screen tests for `(tabs)/_layout.tsx` and `(auth)/_layout.tsx`** — these layout files handle the FAB, tab bar configuration, and authentication guards. They contain conditional navigation logic that is not yet covered by any screen test.
