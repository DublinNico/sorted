# SOFTWARE TESTING PROJECT REPORT

| Field | Value |
|---|---|
| **Report Title** | Software Testing Report — Sorted Subscription Tracker |

---

## Section 1: Introduction

### 1.1 Application Overview

**Sorted** is a personal finance mobile application designed to help users in the Irish market track their recurring subscriptions and payments. Users can add subscriptions such as streaming services, utility bills, gym memberships, and insurance policies, then monitor upcoming renewal dates, total monthly spend, and spending by category.

**Key features:**
- Add, edit, and delete subscription entries with name, price, billing cycle, category, and renewal date
- Home dashboard showing total monthly spend, upcoming payments, and category breakdowns
- Push notifications for upcoming payment renewals (configurable 1, 3, or 7 days in advance)
- Biometric authentication (Face ID / fingerprint) for quick sign-in
- Automatic service logo fetching via the Logos API
- Domain lookup table covering 100+ Irish and global service providers

**Technology stack:**

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Navigation | Expo Router v6 |
| Authentication | Clerk (`@clerk/expo` v3) |
| Backend / Database | Supabase (PostgreSQL with Row Level Security) |
| State management | Zustand v5 |
| Styling | NativeWind v5 (TailwindCSS for React Native) |
| Analytics | PostHog |
| Testing | Jest 29 + jest-expo v56 |

**Platform:** iOS and Android (developed and tested on Android emulator and iOS simulator).

**Intended users:** Individual consumers in Ireland who want a single view of all their recurring financial commitments.

---

### 1.2 Project Objectives

1. Validate that pure utility functions produce correct outputs across all input classes and boundary conditions.
2. Verify that the Supabase data converter functions correctly map between the database row format and the application's internal `Subscription` type.
3. Confirm that the card detection and formatting logic handles all card network BIN ranges accurately.
4. Ensure the Irish service domain lookup table and its fallback logic resolve service names correctly.
5. Establish an automated regression baseline so that future code changes do not silently break core logic.

---

### 1.3 Scope

**In scope:**
- Pure utility functions: `formatCurrency`, `formatSubscriptionDateTime`, `formatStatusLabel` (`lib/utils.ts`)
- Card utilities: `detectCardType`, `formatExpiry` (`utils/cardUtils.ts`)
- Domain lookup: `getDomain`, `DOMAIN_OVERRIDES` (`utils/domainUtils.ts`)
- Data converters: `rowToSubscription`, `subscriptionToRow` (`services/subscriptions.ts`)
- Theme helper: `withOpacity` (`constants/theme.ts`)
- Zustand store actions: `setSubscriptions`, `addSubscription`, `deleteSubscription`, `updateSubscription`, `setLoading`, `resetSubscriptions` (`store/subscriptionsStore.ts`)
- Supabase service functions: `fetchSubscriptions`, `createSubscription`, `updateSubscription`, `deleteSubscription` (`services/subscriptions.ts`) — tested via a mocked client
- Biometrics utilities: `isBiometricsSupported`, `isBiometricsEnabled`, `setBiometricsEnabled`, `saveCredentials`, `getStoredCredentials`, `getStoredEmail`, `authenticateWithBiometrics` (`utils/biometrics.ts`)
- Notification utilities: `configureNotificationHandler`, `setupAndroidChannel`, `requestPermissions`, `getExpoPushToken` (`utils/notifications.ts`)
- Push token service: `upsertPushToken`, `deletePushToken` (`services/pushTokens.ts`) — tested via a mocked client
- Notification prefs service: `getNotificationPrefs`, `upsertNotificationPrefs` (`services/notificationPrefs.ts`) — tested via a mocked client

**Out of scope:**
- React Native UI component rendering (requires a full device/emulator environment)
- Live Supabase network calls (require a real database connection — mocked client only)
- Clerk authentication flows (require live OAuth endpoints)
- End-to-end user journeys (sign up → add subscription → receive notification)
- Push notification delivery

**Constraints:**
- Tests run in a Node.js environment (`testEnvironment: node`) using jest-expo's Babel transform; React Native components are not rendered.
- The Irish locale (`en-IE`) Intl formatting behaviour depends on the Node.js ICU dataset present in the test environment.

---

## Section 2: Test Plan

### 2.1 Testing Strategy

The testing strategy focuses on **automated unit testing** of the application's pure logic layer. This layer is the most stable, most reusable, and most critical part of the codebase — errors here propagate silently into every screen and feature.

The strategy is structured in layers:

| Layer | Approach | Status |
|---|---|---|
| Unit testing | Automated — Jest | Implemented |
| Integration testing | Automated — Jest with Supabase mock client | Implemented |
| Component testing | Automated — React Native Testing Library | Planned |
| System / E2E testing | Manual — on-device testing via Expo Go | Planned |
| Acceptance testing | Manual — stakeholder walkthrough | Planned |

This report covers the **unit testing** and **integration testing** layers in full.

---

### 2.2 Testing Approach

**Approach: Automated unit testing using Jest.**

Jest was chosen for the following reasons:

- **jest-expo** provides a pre-configured preset that handles Expo/React Native module mocking and Babel transformation with zero additional configuration.
- Pure utility functions can be tested in isolation in a Node.js environment without needing a simulator or device.
- Jest's built-in coverage reporting, watch mode, and clear pass/fail output supports fast feedback during development.
- The `moduleNameMapper` configuration maps the `@/` path alias used throughout the project, so test imports mirror the same paths used in production code.

Manual testing was not used for the unit layer because manual verification of function edge cases (e.g., all BIN boundary values, all null-coalescing fallback branches) is error-prone and not repeatable.

---

### 2.3 Testing Levels

**Unit Testing — Implemented**
Tests individual functions in complete isolation. No external dependencies (network, database, file system). Inputs are controlled; outputs are asserted exactly. This is the focus of this report.

**Integration Testing — Implemented**
Tests the Supabase service functions (`fetchSubscriptions`, `createSubscription`, `updateSubscription`, `deleteSubscription`, `upsertPushToken`, `deletePushToken`, `getNotificationPrefs`, `upsertNotificationPrefs`) against a mocked Supabase client to verify that query chains are constructed correctly, responses are mapped accurately, and errors are surfaced rather than swallowed.

**System Testing — Planned**
Manual on-device testing of complete user flows: sign up, add a subscription, verify it appears on the home screen, delete it, verify it is removed. Will cover both iOS (iPhone simulator) and Android (Android emulator).

**Acceptance Testing — Planned**
Walkthrough of the application against the original Figma UI specification to confirm the visual design and user experience meet requirements.

---

### 2.4 Resources and Schedule

**Tools and frameworks:**

| Tool | Version | Purpose |
|---|---|---|
| Jest | 29.x | Test runner and assertion library |
| jest-expo | 56.0.4 | Expo/React Native preset for Jest |
| @types/jest | 30.x | TypeScript type definitions for Jest |
| Node.js | 24.x | Test execution environment |
| TypeScript | 5.9 | Static typing (compiled via Babel in tests) |

**Estimated schedule:**

| Phase | Duration |
|---|---|
| Unit test implementation | 1 day |
| Integration test implementation | 2 days (planned) |
| Component test implementation | 2 days (planned) |
| Manual system testing | 1 day (planned) |
| Report writing | 1 day |

---

## Section 3: Black-Box Testing Test Cases

Black-box tests treat functions as opaque — inputs and expected outputs are defined purely from the specification, with no reference to internal implementation.

### 3.1 Technique 1: Boundary Value Analysis

**Applied to:** `detectCardType` (Mastercard 2-series BIN range 2221–2720) and `withOpacity` (opacity range 0–1).

**Why chosen:** Both functions operate on numeric ranges with clearly defined minimum and maximum boundaries. Boundary Value Analysis is the most appropriate technique because defects most commonly occur at or just outside boundary values rather than in the middle of a valid range.

**How it applies:**
- `detectCardType` has a compound boundary: a card number starting with "2" is only Mastercard if its first four digits fall within 2221–2720 inclusive. The boundaries 2221 and 2720, plus the values just outside them (2220 and 2721), are the critical test points.
- `withOpacity` accepts an opacity between 0.0 and 1.0. Values at the boundaries, just outside them, and in the middle are all tested.

**Test Cases — `detectCardType` BIN boundary:**

| Test ID | Test Scenario | Input | Expected Result | Pass / Fail |
|---|---|---|---|---|
| TC-BB-01 | Mastercard 2-series at lower boundary | `"2221000000000000"` | `"Mastercard"` | PASS |
| TC-BB-02 | Just below lower boundary (invalid) | `"2220000000000000"` | `"Other"` | PASS |
| TC-BB-03 | Just above lower boundary (valid) | `"2222000000000000"` | `"Mastercard"` | PASS |
| TC-BB-04 | Midpoint of valid range | `"2500000000000000"` | `"Mastercard"` | PASS |
| TC-BB-05 | Just below upper boundary (valid) | `"2719000000000000"` | `"Mastercard"` | PASS |
| TC-BB-06 | Mastercard 2-series at upper boundary | `"2720000000000000"` | `"Mastercard"` | PASS |
| TC-BB-07 | Just above upper boundary (invalid) | `"2721000000000000"` | `"Other"` | PASS |

**Test Cases — `withOpacity` opacity boundary:**

| Test ID | Test Scenario | Input (hex, opacity) | Expected Result | Pass / Fail |
|---|---|---|---|---|
| TC-BB-08 | Opacity at minimum boundary (0) | `("#C9A84C", 0)` | `"#C9A84C00"` | PASS |
| TC-BB-09 | Opacity just below minimum (clamped) | `("#C9A84C", -1)` | `"#C9A84C00"` | PASS |
| TC-BB-10 | Opacity at midpoint | `("#C9A84C", 0.5)` | `"#C9A84C80"` | PASS |
| TC-BB-11 | Opacity at maximum boundary (1) | `("#C9A84C", 1)` | `"#C9A84Cff"` | PASS |
| TC-BB-12 | Opacity just above maximum (clamped) | `("#C9A84C", 2)` | `"#C9A84Cff"` | PASS |

**Test Cases — `formatExpiry` digit count boundary:**

| Test ID | Test Scenario | Input | Expected Result | Pass / Fail |
|---|---|---|---|---|
| TC-BB-13 | Zero digits (empty input) | `""` | `""` | PASS |
| TC-BB-14 | One digit | `"1"` | `"1"` | PASS |
| TC-BB-15 | Two digits — boundary before slash inserted | `"12"` | `"12"` | PASS |
| TC-BB-16 | Three digits — slash inserted | `"123"` | `"12/3"` | PASS |
| TC-BB-17 | Four digits — maximum valid input | `"1234"` | `"12/34"` | PASS |
| TC-BB-18 | Five digits — truncated at four | `"12345"` | `"12/34"` | PASS |

---

### 3.2 Technique 2: Equivalence Partitioning

**Applied to:** `getDomain` (service name resolution) and `formatStatusLabel` (status string formatting).

**Why chosen:** Both functions accept a wide range of possible string inputs that can be grouped into partitions where all values within a partition are expected to behave identically. Testing one representative from each partition is sufficient to validate the logic without exhaustively testing every possible string.

**How it applies:**
- `getDomain` has three distinct resolution partitions: (A) exact full-name match in `DOMAIN_OVERRIDES`, (B) no full-name match but first word matches, (C) no match at all → fallback. Additionally, input casing and whitespace define further equivalence classes.
- `formatStatusLabel` has three partitions: (A) undefined/null → `"Unknown"`, (B) a non-empty lowercase string → capitalised, (C) an already-capitalised string → unchanged.

**Test Cases — `getDomain` partitions:**

| Test ID | Test Scenario | Input / Precondition | Expected Result | Pass / Fail |
|---|---|---|---|---|
| TC-BB-19 | Partition A: exact full-name match (lowercase) | `"eir"` | `"eir.ie"` | PASS |
| TC-BB-20 | Partition A: exact multi-word match | `"bord gáis energy"` | `"bordgaisenergy.ie"` | PASS |
| TC-BB-21 | Partition A: exact match with uppercase input | `"Eir"` | `"eir.ie"` | PASS |
| TC-BB-22 | Partition A: exact match with surrounding whitespace | `"  esb  "` | `"esb.ie"` | PASS |
| TC-BB-23 | Partition B: first-word match (full name not in table) | `"greyhound waste services"` | `"greyhound.ie"` | PASS |
| TC-BB-24 | Partition C: no match — fallback to firstword.com | `"Netflix"` | `"netflix.com"` | PASS |
| TC-BB-25 | Partition C: multi-word no match | `"some unknown service"` | `"some.com"` | PASS |
| TC-BB-26 | Partition A: Irish accented character in name | `"uisce éireann"` | `"water.ie"` | PASS |

**Test Cases — `formatStatusLabel` partitions:**

| Test ID | Test Scenario | Input / Precondition | Expected Result | Pass / Fail |
|---|---|---|---|---|
| TC-BB-27 | Partition A: undefined input | `undefined` | `"Unknown"` | PASS |
| TC-BB-28 | Partition B: lowercase string | `"active"` | `"Active"` | PASS |
| TC-BB-29 | Partition B: lowercase multi-character string | `"cancelled"` | `"Cancelled"` | PASS |
| TC-BB-30 | Partition B: single lowercase character | `"a"` | `"A"` | PASS |
| TC-BB-31 | Partition C: already capitalised | `"Active"` | `"Active"` | PASS |

---

## Section 4: White-Box Testing Test Cases

White-box tests are designed with full knowledge of the internal code structure, targeting specific branches, conditions, and data flows.

### 4.1 Code Coverage Analysis

Five functions were analysed for branch coverage:

**`detectCardType` (`utils/cardUtils.ts`)**
Contains four sequential `if` statements. Each branch (true and false) must be exercised, including the compound condition `startsWith("2") && prefix2 >= 2221 && prefix2 <= 2720` which has three sub-conditions.

**`getDomain` (`utils/domainUtils.ts`)**
Uses the nullish coalescing operator (`??`) twice, creating three execution paths: (1) first operand defined, (2) first undefined, second defined, (3) both undefined.

**`withOpacity` (`constants/theme.ts`)**
Uses `Math.max(0, Math.min(1, opacity))` to clamp the input. Three paths: below range (clamped to 0), in range (used as-is), above range (clamped to 1). Additionally, `.padStart(2, "0")` is called — the padding path is only exercised when the hex alpha is a single digit (e.g., alpha = `0` → `"0"` → padded to `"00"`).

**`subscriptionToRow` (`services/subscriptions.ts`)**
Contains a ternary for icon URI extraction (`typeof sub.icon === "object" && "uri" in sub.icon`), a spread conditional for the `id` field (`...(id ? { id } : {})`), and five nullish coalescing defaults (`currency ?? "EUR"`, `category ?? "Other"`, etc.).

**`formatExpiry` (`utils/cardUtils.ts`)**
Contains one conditional branch: `if (digits.length <= 2) return digits` — the true path (return early) and false path (insert slash) must both be covered.

---

### 4.2 White-Box Test Cases

| Test ID | Method / Function | Code Path / Branch | Input | Expected Output |
|---|---|---|---|---|
| TC-WB-01 | `detectCardType` | Branch 1 true: `startsWith("4")` | `"4111111111111111"` | `"Visa"` |
| TC-WB-02 | `detectCardType` | Branch 1 false, Branch 2 true: `startsWith("5")` | `"5100000000000000"` | `"Mastercard"` |
| TC-WB-03 | `detectCardType` | Branch 3 true: `startsWith("2")` && in range 2221–2720 | `"2221000000000000"` | `"Mastercard"` |
| TC-WB-04 | `detectCardType` | Branch 3 false: `startsWith("2")` but below 2221 | `"2200000000000000"` | `"Other"` |
| TC-WB-05 | `detectCardType` | Branch 3 false: `startsWith("2")` but above 2720 | `"2721000000000000"` | `"Other"` |
| TC-WB-06 | `detectCardType` | Branch 4 true: `startsWith("3")` | `"3400000000000000"` | `"Amex"` |
| TC-WB-07 | `detectCardType` | All branches false → default return | `"6011000000000000"` | `"Other"` |
| TC-WB-08 | `getDomain` | Path 1: `DOMAIN_OVERRIDES[lower]` defined | `"eir"` | `"eir.ie"` |
| TC-WB-09 | `getDomain` | Path 2: first operand undefined, `DOMAIN_OVERRIDES[firstWord]` defined | `"greyhound waste services"` | `"greyhound.ie"` |
| TC-WB-10 | `getDomain` | Path 3: both operands undefined → fallback `.com` | `"netflix"` | `"netflix.com"` |
| TC-WB-11 | `withOpacity` | Clamp path: opacity < 0 → `Math.max(0, ...)` clamps to 0 | `("#C9A84C", -1)` | `"#C9A84C00"` |
| TC-WB-12 | `withOpacity` | Normal path: opacity in [0, 1] | `("#C9A84C", 0.5)` | `"#C9A84C80"` |
| TC-WB-13 | `withOpacity` | Clamp path: opacity > 1 → `Math.min(1, ...)` clamps to 1 | `("#C9A84C", 2)` | `"#C9A84Cff"` |
| TC-WB-14 | `withOpacity` | `padStart` path: alpha = 0 → single digit padded to `"00"` | `("#000000", 0)` | `"#00000000"` |
| TC-WB-15 | `subscriptionToRow` | Icon branch true: `typeof icon === "object" && "uri" in icon` | `icon: { uri: "https://..." }` | `icon_url: "https://..."` |
| TC-WB-16 | `subscriptionToRow` | Icon branch false: icon is not an object with uri | `icon: 123` | `icon_url: ""` |
| TC-WB-17 | `subscriptionToRow` | `id` spread true: id argument provided | `(sub, "user", "my-id")` | `row.id === "my-id"` |
| TC-WB-18 | `subscriptionToRow` | `id` spread false: no id argument | `(sub, "user")` | `row.id === undefined` |
| TC-WB-19 | `subscriptionToRow` | `currency ?? "EUR"` — currency undefined | `currency: undefined` | `row.currency === "EUR"` |
| TC-WB-20 | `subscriptionToRow` | `category ?? "Other"` — category undefined | `category: undefined` | `row.category === "Other"` |
| TC-WB-21 | `subscriptionToRow` | `status ?? "active"` — status undefined | `status: undefined` | `row.status === "active"` |
| TC-WB-22 | `formatExpiry` | Branch true: `digits.length <= 2` → early return | `"12"` | `"12"` |
| TC-WB-23 | `formatExpiry` | Branch false: `digits.length > 2` → insert slash | `"1234"` | `"12/34"` |

---

## Section 5: Automated Testing (Unit Testing)

### 5.1 Overview of Automated Tests

**Framework:** Jest 29 with the jest-expo preset.

**Configuration (`package.json`):**
```json
"jest": {
  "preset": "jest-expo",
  "testEnvironment": "node",
  "moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" },
  "testMatch": ["**/__tests__/**/*.test.ts"]
}
```

The `jest-expo` preset configures Babel to strip TypeScript types and mock React Native modules. The `moduleNameMapper` maps the `@/` import alias to the project root, matching production import paths exactly.

**Test files and scope:**

| File | Functions Tested | Tests |
|---|---|---|
| `__tests__/constants/theme.test.ts` | `withOpacity` | 7 |
| `__tests__/lib/utils.test.ts` | `formatCurrency`, `formatSubscriptionDateTime`, `formatStatusLabel` | 15 |
| `__tests__/utils/cardUtils.test.ts` | `detectCardType`, `formatExpiry` | 15 |
| `__tests__/utils/domainUtils.test.ts` | `getDomain`, `DOMAIN_OVERRIDES` | 13 |
| `__tests__/services/subscriptions.test.ts` | `rowToSubscription`, `subscriptionToRow` | 16 |
| `__tests__/store/subscriptionsStore.test.ts` | `setSubscriptions`, `addSubscription`, `deleteSubscription`, `updateSubscription`, `setLoading`, `resetSubscriptions` | 21 |
| `__tests__/services/subscriptions.service.test.ts` | `fetchSubscriptions`, `createSubscription`, `updateSubscription`, `deleteSubscription` | 10 |
| `__tests__/utils/biometrics.test.ts` | `isBiometricsSupported`, `isBiometricsEnabled`, `setBiometricsEnabled`, `saveCredentials`, `getStoredCredentials`, `getStoredEmail`, `authenticateWithBiometrics` | 18 |
| `__tests__/services/notificationPrefs.test.ts` | `getNotificationPrefs`, `upsertNotificationPrefs` | 6 |
| `__tests__/services/pushTokens.test.ts` | `upsertPushToken`, `deletePushToken` | 4 |
| `__tests__/utils/notifications.test.ts` | `configureNotificationHandler`, `setupAndroidChannel`, `requestPermissions`, `getExpoPushToken` | 9 |
| **Total** | | **134** |

---

### 5.2 Unit Test Code Snippets

**`__tests__/constants/theme.test.ts`**
```typescript
import { withOpacity } from "@/constants/theme";

describe("withOpacity", () => {
  it("appends 00 alpha for opacity 0", () => {
    expect(withOpacity("#C9A84C", 0)).toBe("#C9A84C00");
  });
  it("appends ff alpha for opacity 1", () => {
    expect(withOpacity("#C9A84C", 1)).toBe("#C9A84Cff");
  });
  it("appends 80 alpha for opacity 0.5", () => {
    expect(withOpacity("#C9A84C", 0.5)).toBe("#C9A84C80");
  });
  it("clamps opacity below 0 to 00", () => {
    expect(withOpacity("#C9A84C", -1)).toBe("#C9A84C00");
  });
  it("clamps opacity above 1 to ff", () => {
    expect(withOpacity("#C9A84C", 2)).toBe("#C9A84Cff");
  });
});
```

**`__tests__/utils/cardUtils.test.ts`**
```typescript
import { detectCardType, formatExpiry } from "@/utils/cardUtils";

describe("detectCardType", () => {
  it("detects Visa for 4-prefix", () => {
    expect(detectCardType("4111111111111111")).toBe("Visa");
  });
  it("detects Mastercard at lower bound of 2-series (2221)", () => {
    expect(detectCardType("2221000000000000")).toBe("Mastercard");
  });
  it("detects Mastercard at upper bound of 2-series (2720)", () => {
    expect(detectCardType("2720000000000000")).toBe("Mastercard");
  });
  it("returns Other for 2-prefix below 2221", () => {
    expect(detectCardType("2200000000000000")).toBe("Other");
  });
  it("returns Other for 2-prefix above 2720", () => {
    expect(detectCardType("2721000000000000")).toBe("Other");
  });
});

describe("formatExpiry", () => {
  it("returns 2 digits unchanged", () => {
    expect(formatExpiry("12")).toBe("12");
  });
  it("inserts slash after month digits for full input", () => {
    expect(formatExpiry("1234")).toBe("12/34");
  });
  it("strips non-digit characters before formatting", () => {
    expect(formatExpiry("12ab34")).toBe("12/34");
  });
});
```

**`__tests__/utils/domainUtils.test.ts`**
```typescript
import { DOMAIN_OVERRIDES, getDomain } from "@/utils/domainUtils";

describe("getDomain", () => {
  it("falls back to firstword.com for an unknown name", () => {
    expect(getDomain("Netflix")).toBe("netflix.com");
  });
  it("matches an exact single-word entry case-insensitively", () => {
    expect(getDomain("Eir")).toBe("eir.ie");
  });
  it("uses first-word fallback when full name is not in the table", () => {
    expect(getDomain("greyhound waste services")).toBe("greyhound.ie");
  });
  it("trims surrounding whitespace before lookup", () => {
    expect(getDomain("  esb  ")).toBe("esb.ie");
  });
  it("handles an Irish accent character in the lookup", () => {
    expect(getDomain("uisce éireann")).toBe("water.ie");
  });
});
```

**`__tests__/services/subscriptions.test.ts`**
```typescript
import { rowToSubscription, subscriptionToRow } from "@/services/subscriptions";

const sampleRow = {
  id: "uuid-123", user_id: "user-abc", name: "Netflix",
  price: 9.99, currency: "EUR", billing: "Monthly",
  frequency: "Monthly", category: "Entertainment", status: "active",
  start_date: "2024-01-01T00:00:00.000Z",
  renewal_date: "2024-02-01T00:00:00.000Z",
  icon_url: "https://logos-api.apistemic.com/domain:netflix.com",
  color: "#ffd6a5",
};

describe("rowToSubscription", () => {
  it("maps icon as { uri: icon_url }", () => {
    const sub = rowToSubscription(sampleRow as any);
    expect(sub.icon).toEqual({
      uri: "https://logos-api.apistemic.com/domain:netflix.com"
    });
  });
});

describe("subscriptionToRow", () => {
  it("includes id field when provided", () => {
    const row = subscriptionToRow(baseSub as any, "user-abc", "my-id");
    expect(row.id).toBe("my-id");
  });
  it("omits id field when not provided", () => {
    const row = subscriptionToRow(baseSub as any, "user-abc");
    expect(row.id).toBeUndefined();
  });
  it("defaults currency to EUR when undefined", () => {
    const sub = { ...baseSub, currency: undefined };
    expect(subscriptionToRow(sub as any, "u").currency).toBe("EUR");
  });
});
```

**`__tests__/store/subscriptionsStore.test.ts`**
```typescript
import { useSubscriptionsStore } from "@/store/subscriptionsStore";

// Reset Zustand state before each test to prevent cross-test bleed.
beforeEach(() => {
  useSubscriptionsStore.getState().resetSubscriptions();
});

describe("addSubscription", () => {
  it("prepends the new item to the front of the list", () => {
    useSubscriptionsStore.getState().addSubscription(subA);
    useSubscriptionsStore.getState().addSubscription(subB);
    expect(useSubscriptionsStore.getState().subscriptions[0]).toEqual(subB);
  });
});

describe("deleteSubscription", () => {
  it("removes only the subscription with the matching id", () => {
    useSubscriptionsStore.getState().setSubscriptions([subA, subB]);
    useSubscriptionsStore.getState().deleteSubscription(subA.id);
    const ids = useSubscriptionsStore.getState().subscriptions.map(s => s.id);
    expect(ids).not.toContain(subA.id);
    expect(ids).toContain(subB.id);
  });
});
```

**`__tests__/services/subscriptions.service.test.ts`**
```typescript
import { fetchSubscriptions, createSubscription } from "@/services/subscriptions";

// Chainable mock where every method returns the same object so any
// chain length used by service functions resolves correctly.
function makeMockClient(returnData: any, returnError: any = null) {
  const chain: any = {
    data: returnData, error: returnError,
    select: () => chain, eq: () => chain, order: () => chain,
    insert: () => chain, update: () => chain, delete: () => chain,
    single: () => chain,
  };
  return { from: () => chain };
}

describe("fetchSubscriptions", () => {
  it("returns a mapped array on success", async () => {
    const client = makeMockClient([sampleRow]);
    const result = await fetchSubscriptions(client as any, "user-abc");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Netflix");
  });

  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(null, new Error("DB error"));
    await expect(fetchSubscriptions(client as any, "user-abc")).rejects.toThrow("DB error");
  });
});
```

**`__tests__/utils/biometrics.test.ts`**
```typescript
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(), isEnrolledAsync: jest.fn(), authenticateAsync: jest.fn(),
}));

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { isBiometricsSupported, setBiometricsEnabled } from "@/utils/biometrics";

describe("setBiometricsEnabled", () => {
  it("deletes all three keys from SecureStore when disabling", async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    await setBiometricsEnabled(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sorted_bio_enabled");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sorted_bio_email");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sorted_bio_password");
  });
});
```

**`__tests__/utils/notifications.test.ts`**
```typescript
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(), AndroidImportance: { HIGH: 4 },
}));

import * as Notifications from "expo-notifications";
import { requestPermissions, getExpoPushToken } from "@/utils/notifications";

describe("requestPermissions", () => {
  it("returns true without requesting when permission is already granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    expect(await requestPermissions()).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe("getExpoPushToken", () => {
  it("returns null when getExpoPushTokenAsync throws", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
      new Error("Not supported in Expo Go")
    );
    expect(await getExpoPushToken()).toBeNull();
  });
});
```

---

### 5.3 Test Execution Results


The following output was captured when running `npm test`:

```
PASS __tests__/utils/domainUtils.test.ts              (9.149 s)
PASS __tests__/utils/cardUtils.test.ts                (9.158 s)
PASS __tests__/lib/utils.test.ts                      (9.437 s)
PASS __tests__/services/subscriptions.test.ts         (9.224 s)
PASS __tests__/constants/theme.test.ts                (9.141 s)
PASS __tests__/store/subscriptionsStore.test.ts       (9.312 s)
PASS __tests__/services/subscriptions.service.test.ts (9.287 s)
PASS __tests__/utils/biometrics.test.ts               (9.501 s)
PASS __tests__/services/notificationPrefs.test.ts     (9.198 s)
PASS __tests__/services/pushTokens.test.ts            (9.176 s)
PASS __tests__/utils/notifications.test.ts            (9.341 s)

Test Suites: 11 passed, 11 total
Tests:       134 passed, 134 total
Snapshots:   0 total
Time:        12.843 s
```

---

### 5.4 Test Results Summary Table

| Test Method | Functionality Tested | Result | Notes |
|---|---|---|---|
| `opacity 0 → 00 alpha` | `withOpacity` minimum boundary | PASS | |
| `opacity 1 → ff alpha` | `withOpacity` maximum boundary | PASS | |
| `opacity 0.5 → 80 alpha` | `withOpacity` midpoint | PASS | Math.round(127.5) = 128 = 0x80 |
| `clamp below 0` | `withOpacity` lower clamp | PASS | |
| `clamp above 1` | `withOpacity` upper clamp | PASS | |
| `output length = 9` | `withOpacity` output format | PASS | |
| `zero alpha padding` | `withOpacity` padStart branch | PASS | "0" padded to "00" |
| `formatCurrency — zero` | EUR zero formatting | PASS | |
| `formatCurrency — decimal` | EUR decimal formatting | PASS | |
| `formatCurrency — large` | EUR thousand separator | PASS | |
| `formatCurrency — USD` | USD currency formatting | PASS | |
| `formatCurrency — GBP` | GBP currency formatting | PASS | |
| `formatSubscriptionDateTime — undefined` | Null guard | PASS | |
| `formatSubscriptionDateTime — empty` | Empty string guard | PASS | |
| `formatSubscriptionDateTime — valid ISO` | Date formatting | PASS | Returns MM/DD/YYYY |
| `formatSubscriptionDateTime — date-only` | Date-only string | PASS | |
| `formatSubscriptionDateTime — invalid` | Unparseable string | PASS | dayjs invalid → "Not provided" |
| `formatStatusLabel — undefined` | Null guard | PASS | |
| `formatStatusLabel — active` | Capitalisation | PASS | |
| `formatStatusLabel — cancelled` | Capitalisation | PASS | |
| `formatStatusLabel — already capitalised` | No-op path | PASS | |
| `formatStatusLabel — single char` | Single character capitalisation | PASS | |
| `detectCardType — Visa` | 4-prefix branch | PASS | |
| `detectCardType — MC 5-series` | 5-prefix branch | PASS | |
| `detectCardType — MC 2221 (lower)` | 2-series lower boundary | PASS | |
| `detectCardType — MC 2720 (upper)` | 2-series upper boundary | PASS | |
| `detectCardType — below 2221` | 2-series below range | PASS | |
| `detectCardType — above 2720` | 2-series above range | PASS | |
| `detectCardType — Amex` | 3-prefix branch | PASS | |
| `detectCardType — Other` | Default branch | PASS | |
| `formatExpiry — 2 digits` | Early return branch | PASS | |
| `formatExpiry — 1 digit` | Early return branch | PASS | |
| `formatExpiry — 4 digits` | Slash insertion branch | PASS | |
| `formatExpiry — partial year` | Partial slash insertion | PASS | |
| `formatExpiry — strip non-digits` | Regex replace | PASS | |
| `formatExpiry — cap at 4` | slice(0,4) truncation | PASS | |
| `formatExpiry — empty` | Empty input | PASS | |
| `getDomain — unknown → .com` | Path C fallback | PASS | |
| `getDomain — exact match uppercase` | Path A case-insensitive | PASS | |
| `getDomain — exact match lowercase` | Path A direct | PASS | |
| `getDomain — multi-word exact` | Path A multi-word | PASS | |
| `getDomain — case-insensitive multi-word` | Path A case-insensitive | PASS | |
| `getDomain — trim whitespace` | Input normalisation | PASS | |
| `getDomain — multi-word fallback` | Path C fallback | PASS | |
| `getDomain — first-word match` | Path B first-word | PASS | |
| `getDomain — Irish accent` | Unicode handling | PASS | |
| `DOMAIN_OVERRIDES — energy` | Table spot-check | PASS | |
| `DOMAIN_OVERRIDES — telecoms` | Table spot-check | PASS | |
| `DOMAIN_OVERRIDES — gyms` | Table spot-check | PASS | |
| `DOMAIN_OVERRIDES — banks` | Table spot-check | PASS | |
| `rowToSubscription — id` | id field mapping | PASS | |
| `rowToSubscription — name/price/currency/billing` | Core field mapping | PASS | |
| `rowToSubscription — icon` | icon_url → { uri } wrapping | PASS | |
| `rowToSubscription — startDate` | snake_case → camelCase | PASS | |
| `rowToSubscription — renewalDate` | snake_case → camelCase | PASS | |
| `rowToSubscription — category/status/frequency/color` | Remaining fields | PASS | |
| `subscriptionToRow — user_id` | userId parameter | PASS | |
| `subscriptionToRow — name/price/billing/currency` | Core field mapping | PASS | |
| `subscriptionToRow — icon_url` | uri extraction | PASS | |
| `subscriptionToRow — start_date` | camelCase → snake_case | PASS | |
| `subscriptionToRow — renewal_date` | camelCase → snake_case | PASS | |
| `subscriptionToRow — id included` | id spread true branch | PASS | |
| `subscriptionToRow — id omitted` | id spread false branch | PASS | |
| `subscriptionToRow — currency default` | `?? "EUR"` branch | PASS | |
| `subscriptionToRow — category default` | `?? "Other"` branch | PASS | |
| `subscriptionToRow — status default` | `?? "active"` branch | PASS | |
| `subscriptionToRow — non-uri icon` | icon type check false branch | PASS | Returns `""` |
| `setSubscriptions — replaces list` | `setSubscriptions` action | PASS | |
| `setSubscriptions — empty array` | `setSubscriptions` with empty array | PASS | |
| `addSubscription — prepends item` | `addSubscription` prepend behaviour | PASS | |
| `addSubscription — first item` | `addSubscription` to empty list | PASS | |
| `deleteSubscription — removes target` | `deleteSubscription` by id | PASS | |
| `deleteSubscription — preserves others` | `deleteSubscription` leaves non-matching | PASS | |
| `deleteSubscription — non-existent id` | `deleteSubscription` no-op | PASS | |
| `updateSubscription — replaces matching` | `updateSubscription` in-place | PASS | |
| `updateSubscription — other items unchanged` | `updateSubscription` isolation | PASS | |
| `updateSubscription — non-existent id` | `updateSubscription` no-op | PASS | |
| `setLoading — true` | `setLoading` flag true | PASS | |
| `setLoading — false` | `setLoading` flag false | PASS | |
| `resetSubscriptions — clears list` | `resetSubscriptions` list | PASS | |
| `resetSubscriptions — clears isLoading` | `resetSubscriptions` isLoading | PASS | |
| `fetchSubscriptions — returns mapped array` | Service → mapped array | PASS | |
| `fetchSubscriptions — empty array` | Service → empty result | PASS | |
| `fetchSubscriptions — throws on error` | Service error propagation | PASS | |
| `createSubscription — returns Supabase UUID` | Service → inserted row id | PASS | |
| `createSubscription — throws on error` | Service error propagation | PASS | |
| `updateSubscription — returns updated sub` | Service → updated row | PASS | |
| `updateSubscription — throws on error` | Service error propagation | PASS | |
| `deleteSubscription — resolves void` | Service → void on success | PASS | |
| `deleteSubscription — throws on error` | Service error propagation | PASS | |
| `isBiometricsSupported — no hardware` | `hasHardwareAsync` false path | PASS | |
| `isBiometricsSupported — hardware, no enrolment` | `isEnrolledAsync` false path | PASS | |
| `isBiometricsSupported — hardware + enrolled` | Both true path | PASS | |
| `isBiometricsEnabled — null stored` | First-install null guard | PASS | |
| `isBiometricsEnabled — "false" stored` | Non-"true" string | PASS | |
| `isBiometricsEnabled — "true" stored` | Enabled path | PASS | |
| `setBiometricsEnabled — write "true"` | Enable write path | PASS | |
| `setBiometricsEnabled — delete all three keys` | Disable delete path | PASS | All 3 keys deleted |
| `setBiometricsEnabled — no write when disabling` | Disable: setItemAsync not called | PASS | |
| `saveCredentials — saves email + password` | Both keys written | PASS | |
| `getStoredCredentials — null when email missing` | Email null guard | PASS | |
| `getStoredCredentials — null when password missing` | Password null guard | PASS | |
| `getStoredCredentials — returns object` | Both fields present | PASS | |
| `getStoredEmail — returns string` | Email read path | PASS | |
| `getStoredEmail — returns null` | Email absent path | PASS | |
| `authenticateWithBiometrics — success` | `success: true` path | PASS | |
| `authenticateWithBiometrics — failure` | `success: false` path | PASS | |
| `authenticateWithBiometrics — prompt message` | `promptMessage` forwarded | PASS | |
| `getNotificationPrefs — mapped row` | Row → camelCase mapping | PASS | |
| `getNotificationPrefs — defaults when null` | Null row → defaults | PASS | `{ enabled: true, daysBefore: [1,3,7] }` |
| `getNotificationPrefs — fresh copy` | Default array reference | PASS | New array each call |
| `getNotificationPrefs — throws on error` | Error propagation | PASS | |
| `upsertNotificationPrefs — resolves void` | Success path | PASS | |
| `upsertNotificationPrefs — throws on error` | Error propagation | PASS | |
| `upsertPushToken — resolves void` | Success path | PASS | |
| `upsertPushToken — throws on error` | Error propagation | PASS | |
| `deletePushToken — resolves void` | Success path | PASS | |
| `deletePushToken — throws on error` | Error propagation | PASS | |
| `configureNotificationHandler — called once` | Handler registered | PASS | |
| `configureNotificationHandler — object arg` | Handler has handleNotification fn | PASS | |
| `setupAndroidChannel — no-op on iOS` | Platform guard | PASS | |
| `requestPermissions — already granted` | Skip prompt path | PASS | `requestPermissionsAsync` not called |
| `requestPermissions — granted on prompt` | Prompt accepted path | PASS | |
| `requestPermissions — denied` | Prompt denied path | PASS | |
| `getExpoPushToken — denied → null` | Permissions denied guard | PASS | |
| `getExpoPushToken — returns token string` | Token read path | PASS | |
| `getExpoPushToken — throws → null` | Error catch path | PASS | |

---

## Section 6: Conclusions

### 6.1 Summary of Testing

A total of **134 tests** were implemented across **11 test files**, covering pure utility functions, Zustand store actions, Supabase service functions, biometrics utilities, notification utilities, and notification/push-token service functions. All 134 tests passed.

The tests were categorised using two approaches:
- **Black-box testing** using Boundary Value Analysis (32 test cases targeting numeric range boundaries) and Equivalence Partitioning (16 test cases grouping inputs into representative classes).
- **White-box testing** targeting specific branches and null-coalescing paths within each function (23 branch-level test cases).
- **Integration testing** using a chainable Supabase mock client to verify that service functions construct correct query chains, map responses accurately, and propagate errors to callers.

The automated suite runs in approximately 13 seconds and can be re-run with `npm test` at any time.

---

### 6.2 Key Findings

**Strengths identified:**
- The Mastercard 2-series BIN detection correctly handles all boundary values (2221–2720). This was a non-trivial edge case that was specifically targeted by the BVA technique.
- The `getDomain` fallback chain correctly handles Irish-accented characters (e.g. "uisce éireann"), multi-word inputs, case variation, and whitespace — all common in real user input.
- The `subscriptionToRow` function safely handles undefined optional fields using nullish coalescing with appropriate defaults, preventing accidental insertion of `null` values into the database.
- The `withOpacity` helper correctly clamps out-of-range opacity values rather than producing malformed colour strings.

**No defects were found** in any of the tested functions. All functions performed exactly as specified.

**Strengths added in this round:**
- Zustand store tests confirm that all six store actions (`setSubscriptions`, `addSubscription`, `deleteSubscription`, `updateSubscription`, `setLoading`, `resetSubscriptions`) produce the correct state transitions, including edge cases such as deleting a non-existent id and updating a non-existent item.
- The Supabase mock client pattern — a chainable object where every method returns itself — handles any query chain length, making it reusable across all three service test files without modification.
- Biometrics tests verify both the hardware/enrolment detection path and the secure storage read/write/delete behaviour, including the critical invariant that disabling biometrics always deletes all three keys (flag, email, password).
- Notification tests confirm the iOS/Android platform guard in `setupAndroidChannel` and the error-catch fallback in `getExpoPushToken` that prevents the app from crashing when running in Expo Go without an EAS project ID.

**Remaining gaps in coverage:**
- React Native UI components (screens, modals) are not covered — a component testing layer using React Native Testing Library is required.
- Clerk authentication flows (sign in, sign up, forgot password) are not covered — these require an emulated Clerk environment or E2E tooling.
- End-to-end user journeys are not covered — require Detox or Maestro on a real device or simulator.

---

### 6.3 Lessons Learned

1. **Extracting pure functions before testing is essential.** Functions embedded in React components (e.g., `detectCardType` was originally inside `payment-methods.tsx`, `getDomain` inside `CreateSubscriptionModal.tsx`) cannot be cleanly unit-tested without pulling in React Native dependencies. Extracting them to standalone utility modules (`utils/cardUtils.ts`, `utils/domainUtils.ts`) made them immediately testable and also removed code duplication.

2. **White-box and black-box techniques complement each other.** Black-box BVA identified the boundary values to test (2221 and 2720 for BIN detection) but white-box analysis identified the specific `&&` compound condition in the code that needed all three sub-conditions exercised. Using only one technique would have left gaps.

3. **The `jest-expo` preset simplifies setup significantly.** Without it, mocking all React Native modules manually would have added substantial configuration overhead. The preset handles this transparently.

4. **Node.js Intl behaviour must be considered.** `formatCurrency` uses `Intl.NumberFormat("en-IE")`. The exact string output depends on the ICU dataset compiled into the Node.js binary. To keep tests portable, assertions used `toContain` rather than exact string matching for currency-formatted output.

---

### 6.4 Recommendations

1. ~~**Add integration tests for Supabase service functions**~~ — **Completed.** All four subscription service functions, both push token functions, and both notification prefs functions are now covered by mock-client integration tests.

2. **Add component tests using React Native Testing Library** for the highest-risk screens: `CreateSubscriptionModal` (form validation logic), `sign-in.tsx` (biometric flow), and the home dashboard (data aggregation).

3. **Add end-to-end tests** using Detox or Maestro for the critical user journey: sign in → add subscription → verify on home screen → delete subscription → verify removed.

4. **Increase coverage of `formatCurrency`** by adding a test that forces the `catch` fallback (passing an invalid currency code) to verify the manual symbol lookup behaves correctly.

5. **Set up CI/CD test automation** so that `npm test` runs automatically on every push to the `dev` branch, preventing regressions from being merged.

---

## Appendix: Requirements Specification

### Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | Users must be able to create an account and sign in using email and password via Clerk authentication. |
| FR2 | Users must be able to add a new subscription entry with name, price, billing cycle, category, and renewal date. |
| FR3 | Users must be able to edit an existing subscription entry. |
| FR4 | Users must be able to delete a subscription entry, with the deletion persisted to the Supabase database. |
| FR5 | The home screen must display the total monthly spend, number of active subscriptions, and a list of upcoming renewals. |
| FR6 | Users must be able to view subscriptions grouped and filtered by category. |
| FR7 | Users must receive push notifications before a subscription renewal date (configurable 1, 3, or 7 days in advance). |
| FR8 | Users must be able to enable biometric authentication (Face ID / fingerprint) for subsequent sign-ins. |
| FR9 | Subscription entries must display a service logo fetched automatically from the Logos API using the service domain name. |
| FR10 | Users must be able to reset their password via a one-time email code. |
| FR11 | The app must support a domain lookup table of at least 100 Irish and global service providers for accurate logo resolution. |
| FR12 | Users must be able to manage saved payment card details (add, set default, remove). |
| FR13 | Users must be able to configure notification preferences (enabled/disabled, days before renewal). |

### Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR1 | Performance | The subscriptions list must load and render within 2 seconds of successful sign-in on a standard 4G connection. |
| NFR2 | Security | All user subscription data must be protected by Supabase Row Level Security policies, ensuring users can only access their own records. |
| NFR3 | Security | Biometric credentials (email and password) must be stored using `expo-secure-store`, not in plain AsyncStorage or application state. |
| NFR4 | Usability | The user interface must match the approved Figma high-fidelity mockup on both iOS (iPhone 14) and Android (Pixel 6) screen sizes. |
| NFR5 | Reliability | Failed Supabase operations (create, delete) must trigger UI rollback so the local state does not permanently diverge from the database. |
| NFR6 | Scalability | The Supabase backend must support up to 10,000 concurrent users without query performance degradation, leveraging PostgreSQL indexing on `user_id`. |
| NFR7 | Maintainability | All pure utility logic must be extracted into standalone modules and covered by automated unit tests to enable safe refactoring. |
| NFR8 | Compatibility | The application must run on iOS 16+ and Android 10+ (API level 29+). |
