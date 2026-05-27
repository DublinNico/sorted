# SOFTWARE TESTING PROJECT REPORT — Component Tests

| Field | Value |
|---|---|
| **Report Title** | Component Testing Report — Sorted Subscription Tracker |

---

## Section 1: Introduction

### 1.1 Application Overview

See `REPORT_unit.md` Section 1.1 for a full application overview.

---

### 1.2 Project Objectives

1. Validate that UI components render the correct text and elements given a range of prop combinations.
2. Verify that form validation logic in `CreateSubscriptionModal` prevents invalid submissions and calls `onSubmit` with the correct payload.
3. Confirm that interactive elements (buttons, cards, dropdowns, calendar footer) call the correct callbacks with the correct arguments when pressed.
4. Ensure that conditional rendering (expand/collapse, edit mode title) behaves as specified.

---

### 1.3 Scope

**In scope:**
- `components/CreateSubscriptionModal.tsx` — form validation, auto-category derivation, submit payload, edit mode title, close handler, logo preview visibility
- `components/SubscriptionCard.tsx` — renders name/price/billing, expand/collapse delete & edit button visibility, press callbacks, One-off billing badge, Mark as Paid button
- `components/CalendarPicker.tsx` — month/year header, weekday headers, Today/Clear footer actions
- `components/UpcommingSubscriptionCard.tsx` — renders name/price, daysLeft countdown text
- `components/ListHeading.tsx` — renders title, View all press callback

**Out of scope:**
- Screen-level layouts and navigation (to be covered in a separate screen test report)
- Network calls and Supabase integration (covered in `REPORT_unit.md`)
- End-to-end flows (to be covered in `REPORT_e2e.md`)
- `components/CalendarPicker.tsx` — tapping individual day cells (day-grid cells share repeated text labels; deterministic selection requires additional test setup)

**Mocking strategy:**
- `@expo/vector-icons` (`Ionicons`) — mocked to `() => null` in all files that import it, because Ionicons requires native font assets not available in the Node.js test environment.
- `posthog-react-native` (`usePostHog`) — mocked in the `CreateSubscriptionModal` test file to prevent real analytics calls.
- `@/components/CalendarPicker` — mocked to a no-op component inside the `CreateSubscriptionModal` test so `CalendarPicker`'s own Ionicons dependency does not double-require the mock.
- `global.css` — all CSS imports are intercepted by a `moduleNameMapper` rule and replaced with an empty stub (`__mocks__/fileMock.js`).

---

## Section 2: Test Plan

### 2.1 Testing Strategy

| Layer | Approach | Status |
|---|---|---|
| Unit testing | Automated — Jest | Implemented |
| Integration testing | Automated — Jest with Supabase mock client | Implemented |
| Component testing | Automated — React Native Testing Library | Implemented |
| System / E2E testing | Automated — Detox on Android emulator | Implemented |
| Acceptance testing | Manual — stakeholder walkthrough | Planned |

---

### 2.2 Testing Approach

**Approach: Automated component testing using React Native Testing Library (RNTL) v13.**

RNTL renders components using the React Native renderer directly in Node.js, without a simulator or device. The renderer produces a React tree that tests query by text content, placeholder text, and other accessible attributes, then fire events to simulate user interactions.

Each component is rendered in complete isolation with controlled props. Third-party native dependencies (Ionicons, PostHog) are mocked so the tests only exercise the component's own logic. CSS imports are stubbed via `moduleNameMapper` so NativeWind class names do not cause parse errors.

**Why RNTL over snapshot testing:** Snapshot tests freeze a component's entire serialised tree; they fail on every cosmetic change and give no indication of whether the change was intentional. RNTL queries by user-visible text and interaction outcome, making tests robust to refactoring.

---

### 2.3 Testing Levels

**Component Testing — Implemented**
Renders individual components with controlled props and asserts on visible text, conditional rendering, and callback invocations. No external dependencies (network, database, device hardware).

---

### 2.4 Resources and Schedule

**Tools and frameworks:**

| Tool | Version | Purpose |
|---|---|---|
| Jest | 29.x | Test runner and assertion library |
| jest-expo | 56.0.4 | Expo/React Native Babel preset for Jest |
| @testing-library/react-native | 13.x | Component rendering and fireEvent interaction |
| react-test-renderer | 19.1.0 | Peer dependency of RNTL (pinned to match project React) |
| Node.js | 24.x | Test execution environment |
| TypeScript | 5.9 | Static typing (compiled via Babel in tests) |

---

## Section 3: Black-Box Testing Test Cases

Black-box tests treat each component as opaque — tests are designed purely from the component's visible behaviour and prop contract, with no reference to internal state or implementation.

### 3.1 Technique 1: Boundary Value Analysis

**Applied to:** `UpcommingSubscriptionCard` (`daysLeft` boundary between plural countdown and singular "Last day" label).

**Why chosen:** The component has a single numeric boundary condition (`daysLeft > 1`) that determines which of two text strings is shown. Values at and just either side of the boundary are the critical test points.

**Test Cases:**

| Test ID | Test Scenario | Input (`daysLeft`) | Expected Text | Pass / Fail |
|---|---|---|---|---|
| TC-BB-C-01 | daysLeft above boundary — plural countdown | `5` | `"5 days left"` | PASS |
| TC-BB-C-02 | daysLeft at boundary (1) — singular label | `1` | `"Last day"` | PASS |

---

### 3.2 Technique 2: Equivalence Partitioning

**Applied to:** `CreateSubscriptionModal` form validation (three input-state partitions) and `SubscriptionCard` expanded/collapsed rendering (two state partitions).

**How it applies:**
- `CreateSubscriptionModal` has three input partitions: (A) both fields empty → submit blocked, (B) only one field filled → submit blocked, (C) both fields filled → submit fires.
- `SubscriptionCard` has two rendering partitions: (A) `expanded={false}` → action buttons hidden, (B) `expanded={true}` → action buttons visible.

**Test Cases — `CreateSubscriptionModal` form validation:**

| Test ID | Test Scenario | Partition | Expected Result | Pass / Fail |
|---|---|---|---|---|
| TC-BB-C-03 | Both fields empty | A: neither filled | `onSubmit` not called | PASS |
| TC-BB-C-04 | Both fields filled | C: both filled | `onSubmit` called once | PASS |

**Test Cases — `SubscriptionCard` expand state:**

| Test ID | Test Scenario | Partition | Expected Result | Pass / Fail |
|---|---|---|---|---|
| TC-BB-C-05 | Card collapsed | A: `expanded={false}` | Delete button absent | PASS |
| TC-BB-C-06 | Card expanded | B: `expanded={true}` | Delete button present | PASS |

---

## Section 4: White-Box Testing Test Cases

White-box tests are designed with knowledge of the component's internal logic, targeting specific conditional branches and callback wiring.

### 4.1 Code Coverage Analysis

**`CreateSubscriptionModal`**
Contains a ternary `isEditMode ? "Edit Payment" : "New Payment"` for the modal title (two branches). Contains an early-return guard in `handleSubmit` (`if (!isValid) return`) that creates a true branch (blocked) and a false branch (fires `onSubmit`). The `PAYMENT_TYPE_CATEGORY` lookup derives the category from the selected type — tested by selecting a non-default type and verifying the category in the payload.

**`SubscriptionCard`**
Contains `{expanded && (<View>...</View>)}` — both the true branch (action buttons rendered) and false branch (action buttons absent) are covered. Contains `billing === "One-off"` branch in the price column (shows Paid/Unpaid badge vs. billing frequency text). Contains `billing === "One-off" && status === "unpaid"` guard for the Mark as Paid button.

**`CreateSubscriptionModal` — logo preview**
Contains `{name.trim().length > 0 && (<View testID="logo-preview">...</View>)}` — true branch (preview shown when name is non-empty) and false branch (preview absent when name is empty) are both covered.

**`UpcommingSubscriptionCard`**
Contains `daysLeft > 1 ? \`${daysLeft} days left\` : "Last day"` — both branches are covered by the BVA test cases above.

**`CalendarPicker`**
`handleToday` and `handleClear` are two independent handler paths triggered by the footer buttons — both are covered.

---

### 4.2 White-Box Test Cases

| Test ID | Component | Code Path / Branch | Input / Action | Expected Output | Pass / Fail |
|---|---|---|---|---|---|
| TC-WB-C-01 | `CreateSubscriptionModal` | `isEditMode` true branch — title ternary | `initialData` provided | Title = `"Edit Payment"` | PASS |
| TC-WB-C-02 | `CreateSubscriptionModal` | `isEditMode` false branch — title ternary | No `initialData` | Title = `"New Payment"` | PASS |
| TC-WB-C-03 | `CreateSubscriptionModal` | `handleSubmit` early return — `!isValid` true | Empty fields, press submit | `onSubmit` not called | PASS |
| TC-WB-C-04 | `CreateSubscriptionModal` | `handleSubmit` executes — `!isValid` false | Fields filled, press submit | `onSubmit` called with payload | PASS |
| TC-WB-C-05 | `CreateSubscriptionModal` | `PAYMENT_TYPE_CATEGORY` lookup | Select "Subscription - Entertainment" | `payload.category === "Entertainment"` | PASS |
| TC-WB-C-06 | `SubscriptionCard` | `expanded && (...)` false branch | `expanded={false}` | Delete button absent | PASS |
| TC-WB-C-07 | `SubscriptionCard` | `expanded && (...)` true branch | `expanded={true}` | Delete button present | PASS |
| TC-WB-C-08 | `UpcommingSubscriptionCard` | `daysLeft > 1` true branch | `daysLeft={5}` | `"5 days left"` shown | PASS |
| TC-WB-C-09 | `UpcommingSubscriptionCard` | `daysLeft > 1` false branch | `daysLeft={1}` | `"Last day"` shown | PASS |
| TC-WB-C-10 | `CalendarPicker` | `handleToday` — selects today + closes | Press "Today" | `onSelect(today)`, `onClose()` called | PASS |
| TC-WB-C-11 | `CalendarPicker` | `handleClear` — clears selection + closes | Press "Clear" | `onSelect("")`, `onClose()` called | PASS |
| TC-WB-C-12 | `SubscriptionCard` | `billing === "One-off"` — Unpaid badge branch | `billing="One-off"`, `status="unpaid"` | "Unpaid" badge shown | PASS |
| TC-WB-C-13 | `SubscriptionCard` | `billing === "One-off"` — Paid badge branch | `billing="One-off"`, `status="paid"` | "Paid" badge shown | PASS |
| TC-WB-C-14 | `SubscriptionCard` | `billing === "One-off"` — billing text absent | `billing="One-off"` | "One-off" text not rendered | PASS |
| TC-WB-C-15 | `SubscriptionCard` | `billing === "One-off" && status === "unpaid"` — Mark as Paid shown | expanded, unpaid one-off | "Mark as Paid" button present | PASS |
| TC-WB-C-16 | `SubscriptionCard` | `onMarkPaid` callback path | Press "Mark as Paid" | `onMarkPaid` called once | PASS |
| TC-WB-C-17 | `SubscriptionCard` | `status === "paid"` — Mark as Paid absent | expanded, paid one-off | "Mark as Paid" button absent | PASS |
| TC-WB-C-18 | `CreateSubscriptionModal` | `name.trim().length > 0` — logo preview false branch | Name field empty | `logo-preview` absent | PASS |
| TC-WB-C-19 | `CreateSubscriptionModal` | `name.trim().length > 0` — logo preview true branch | Name field has text | `logo-preview` present | PASS |

---

## Section 5: Automated Testing (Component Testing)

### 5.1 Overview of Automated Tests

**Framework:** React Native Testing Library v13 with the jest-expo preset.

**Jest configuration additions (`package.json`):**
```json
"moduleNameMapper": {
  "\\.css$": "<rootDir>/__mocks__/fileMock.js",
  "^@/(.*)$": "<rootDir>/$1"
},
"testMatch": [
  "**/__tests__/**/*.test.ts",
  "**/__tests__/**/*.test.tsx"
]
```

The CSS rule is placed before the `@/` alias rule so that `import "@/global.css"` is intercepted and replaced with an empty stub rather than attempting to parse TailwindCSS syntax as JavaScript.

**Test files and scope:**

| File | Component Tested | Tests |
|---|---|---|
| `__tests__/components/ListHeading.test.tsx` | `ListHeading` | 3 |
| `__tests__/components/UpcommingSubscriptionCard.test.tsx` | `UpcommingSubscriptionCard` | 4 |
| `__tests__/components/SubscriptionCard.test.tsx` | `SubscriptionCard` | 15 |
| `__tests__/components/CalendarPicker.test.tsx` | `CalendarPicker` | 4 |
| `__tests__/components/CreateSubscriptionModal.test.tsx` | `CreateSubscriptionModal` | 9 |
| **Total** | | **35** |

---

### 5.2 Component Test Code Snippets

**`__tests__/components/SubscriptionCard.test.tsx`**
```typescript
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import SubscriptionCard from "@/components/SubscriptionCard";

const baseProps: SubscriptionCardProps = {
  name: "Netflix", price: 9.99, currency: "EUR",
  icon: { uri: "https://example.com/icon.png" },
  billing: "Monthly", color: "#ffd6a5", category: "Entertainment",
  renewalDate: "2026-06-01T00:00:00.000Z",
  expanded: false, onPress: jest.fn(),
  onCancelPress: jest.fn(), onEditPress: jest.fn(),
};

describe("SubscriptionCard — collapsed state", () => {
  it("does not render the delete button when collapsed", () => {
    const { queryByText } = render(<SubscriptionCard {...baseProps} expanded={false} />);
    expect(queryByText("Delete Subscription")).toBeNull();
  });
});

describe("SubscriptionCard — expanded state", () => {
  it("calls onCancelPress when the delete button is pressed", () => {
    const onCancelPress = jest.fn();
    const { getByText } = render(
      <SubscriptionCard {...baseProps} expanded={true} onCancelPress={onCancelPress} />
    );
    fireEvent.press(getByText("Delete Subscription"));
    expect(onCancelPress).toHaveBeenCalledTimes(1);
  });
});
```

**`__tests__/components/CreateSubscriptionModal.test.tsx`**
```typescript
jest.mock("posthog-react-native", () => ({ usePostHog: () => ({ capture: jest.fn() }) }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/components/CalendarPicker", () => () => null);

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";

const baseProps = { visible: true, onClose: jest.fn(), onSubmit: jest.fn() };

describe("CreateSubscriptionModal", () => {
  it("does not call onSubmit when name and price are empty", () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<CreateSubscriptionModal {...baseProps} onSubmit={onSubmit} />);
    fireEvent.press(getByText("Add Payment"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("derives the correct category from the selected payment type", () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <CreateSubscriptionModal {...baseProps} onSubmit={onSubmit} />
    );
    fireEvent.press(getByText("Rent / Housing"));
    fireEvent.press(getByText("Subscription - Entertainment"));
    fireEvent.changeText(getByPlaceholderText("e.g., Spotify, Electricity, Rent"), "Netflix");
    fireEvent.changeText(getByPlaceholderText("9.99"), "9.99");
    fireEvent.press(getByText("Add Payment"));
    expect(onSubmit.mock.calls[0][0].category).toBe("Entertainment");
  });
});
```

**`__tests__/components/CalendarPicker.test.tsx`**
```typescript
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import dayjs from "dayjs";
import CalendarPicker from "@/components/CalendarPicker";

describe("CalendarPicker", () => {
  it("calls onSelect with today's date and onClose when Today is pressed", () => {
    const onSelect = jest.fn();
    const onClose  = jest.fn();
    const { getByText } = render(
      <CalendarPicker visible={true} value="" onSelect={onSelect} onClose={onClose} />
    );
    fireEvent.press(getByText("Today"));
    expect(onSelect).toHaveBeenCalledWith(dayjs().format("DD/MM/YYYY"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

---

### 5.3 Test Execution Results

The following output was captured when running `npm test`:

```
PASS __tests__/components/UpcommingSubscriptionCard.test.tsx  (7.762 s)
PASS __tests__/components/ListHeading.test.tsx                (7.990 s)
PASS __tests__/components/SubscriptionCard.test.tsx           (8.611 s)
PASS __tests__/components/CreateSubscriptionModal.test.tsx    (10.555 s)
PASS __tests__/components/CalendarPicker.test.tsx             (10.670 s)

Test Suites: 5 passed, 5 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        ~11 s
```

Full suite (all 27 files including unit, integration, and screen tests):
```text
Test Suites: 27 passed, 27 total
Tests:       284 passed, 284 total
Time:        ~15 s
```

---

### 5.4 Test Results Summary Table

| Test Method | Component | Functionality Tested | Result |
|---|---|---|---|
| `renders the title text` | `ListHeading` | Title prop displayed | PASS |
| `renders the View all button` | `ListHeading` | Button always present | PASS |
| `calls onViewAll when pressed` | `ListHeading` | Callback fired on press | PASS |
| `renders the subscription name` | `UpcommingSubscriptionCard` | Name prop displayed | PASS |
| `renders the formatted price` | `UpcommingSubscriptionCard` | Price via formatCurrency | PASS |
| `shows "{n} days left" when daysLeft > 1` | `UpcommingSubscriptionCard` | Plural countdown branch | PASS |
| `shows "Last day" when daysLeft is 1` | `UpcommingSubscriptionCard` | Singular label branch | PASS |
| `renders the subscription name` | `SubscriptionCard` | Name prop displayed | PASS |
| `renders the formatted price` | `SubscriptionCard` | Price via formatCurrency | PASS |
| `renders the billing cycle` | `SubscriptionCard` | Billing prop displayed | PASS |
| `calls onPress when the card is tapped` | `SubscriptionCard` | Press event propagation | PASS |
| `does not render the delete button when collapsed` | `SubscriptionCard` | `expanded={false}` branch | PASS |
| `renders the delete button when expanded` | `SubscriptionCard` | `expanded={true}` branch | PASS |
| `calls onCancelPress when delete is pressed` | `SubscriptionCard` | Delete callback fired | PASS |
| `renders the edit button when expanded` | `SubscriptionCard` | Edit button visibility | PASS |
| `calls onEditPress when edit is pressed` | `SubscriptionCard` | Edit callback fired | PASS |
| `renders Unpaid badge for unpaid one-off` | `SubscriptionCard` | One-off billing unpaid badge | PASS |
| `renders Paid badge for paid one-off` | `SubscriptionCard` | One-off billing paid badge | PASS |
| `does not render billing frequency for one-off` | `SubscriptionCard` | One-off billing text absent | PASS |
| `renders Mark as Paid when expanded and unpaid` | `SubscriptionCard` | Mark as Paid button visibility | PASS |
| `calls onMarkPaid when Mark as Paid pressed` | `SubscriptionCard` | Mark as Paid callback fired | PASS |
| `does not render Mark as Paid when already paid` | `SubscriptionCard` | Mark as Paid absent for paid bills | PASS |
| `renders current month/year header` | `CalendarPicker` | Header label shown | PASS |
| `Today fires onSelect + onClose` | `CalendarPicker` | handleToday path | PASS |
| `Clear fires onSelect("") + onClose` | `CalendarPicker` | handleClear path | PASS |
| `renders weekday column headers` | `CalendarPicker` | Mo…Su headers shown | PASS |
| `renders the New Payment title` | `CreateSubscriptionModal` | isEditMode false branch | PASS |
| `does not call onSubmit when fields empty` | `CreateSubscriptionModal` | handleSubmit early return | PASS |
| `calls onSubmit when fields are filled` | `CreateSubscriptionModal` | handleSubmit fires | PASS |
| `passes name and price in payload` | `CreateSubscriptionModal` | Payload field values | PASS |
| `derives category from payment type` | `CreateSubscriptionModal` | PAYMENT_TYPE_CATEGORY lookup | PASS |
| `calls onClose when close is pressed` | `CreateSubscriptionModal` | handleClose callback | PASS |
| `renders Edit Payment title with initialData` | `CreateSubscriptionModal` | isEditMode true branch | PASS |
| `does not show logo preview when name is empty` | `CreateSubscriptionModal` | Logo preview hidden on mount | PASS |
| `shows logo preview when name is typed` | `CreateSubscriptionModal` | Logo preview shown on name entry | PASS |

---

## Section 6: Conclusions

### 6.1 Summary of Testing

A total of **35 component tests** are implemented across 5 test files, covering all five UI components specified in the test plan. All 35 tests pass.

The tests are split between black-box and white-box approaches:
- **Black-box** (Boundary Value Analysis + Equivalence Partitioning): 6 test cases targeting input validation partitions and the `daysLeft` boundary.
- **White-box**: 19 branch-level test cases covering conditional rendering, early-return guards, callback dispatch paths, One-off billing badge logic, Mark as Paid visibility, and logo preview conditional rendering.

Combined with the 127 unit and integration tests from `REPORT_unit.md`, the component suite stands at **162 tests across 16 files**. With the addition of 122 screen tests (`REPORT_screens.md`), the full Jest suite stands at **284 tests across 27 files**.

---

### 6.2 Key Findings

**Strengths identified:**
- RNTL's `fireEvent` propagates press events up the component tree, allowing tests to press visible text labels rather than having to locate the wrapping Pressable directly. This keeps assertions readable and decoupled from the component hierarchy.
- Mocking `@/components/CalendarPicker` inside the `CreateSubscriptionModal` test file prevents transitive Ionicons dependency from causing setup failures — a pattern worth repeating for any test file that renders a composite component with native dependencies.
- The `CreateSubscriptionModal` validation guard (`if (!isValid) return`) is fully covered: one test confirms the guard blocks submission, another confirms it allows submission when both fields are present.

**Issues discovered and resolved:**
- `react-test-renderer` was installed at `19.2.3` by default but the project uses React `19.1.0`. RNTL v13 performs a strict peer version check and throws before any test runs. Fixed by pinning `react-test-renderer@19.1.0`.
- `import "@/global.css"` inside `CreateSubscriptionModal` was being resolved to the actual CSS file by the `@/` alias rule before the CSS stub rule could intercept it. Fixed by reordering `moduleNameMapper` so the CSS stub rule is evaluated first.

**No defects were found** in any of the tested components. All components rendered and behaved exactly as specified.

**Remaining gaps:**
- `CalendarPicker` individual day cell selection is not tested — day cells share repeated numeric text labels (e.g. multiple cells labelled `"1"` across current and overflow months) making deterministic selection complex without `testID` props on the cells.
- `(tabs)/_layout.tsx` and `(auth)/_layout.tsx` are not yet tested at the screen level.

---

### 6.3 Lessons Learned

1. **`moduleNameMapper` key order matters.** Jest evaluates patterns top-to-bottom and returns on the first match. A broad alias rule (`^@/(.*)$`) will shadow a narrower extension rule (`\.css$`) if it is listed first. Always place more specific rules above broader ones.

2. **Pin `react-test-renderer` explicitly.** RNTL v13 enforces a strict version match with the installed React. When React is managed separately (e.g. `19.1.0` via a patch resolution), `react-test-renderer` can drift to a newer minor on install. Adding it explicitly to `devDependencies` prevents the mismatch.

3. **Mock at the right level.** Mocking `CalendarPicker` inside the `CreateSubscriptionModal` test — rather than mocking Ionicons globally — keeps the CalendarPicker test file free to test Ionicons-dependent rendering independently.

4. **Behavioural tests are more durable than prop-inspection tests.** Checking that `onSubmit` is not called (behaviour) is more resilient than checking `button.props.disabled === true` (implementation). If the validation mechanism changes from a `disabled` prop to a different guard, the behaviour test still passes.

---

### 6.4 Recommendations

1. **Add `testID` props to `CalendarPicker` day cells** to enable deterministic day selection tests. A `testID` of `"day-{date}"` (e.g. `"day-2026-06-15"`) would allow tests to select a specific date without ambiguity.

2. ~~**Add screen-level tests**~~ — **Completed.** 11 screen test files covering all major screens are in `REPORT_screens.md`.

3. ~~**Add end-to-end tests**~~ — **Completed.** 13 E2E test cases are written using Detox 20. See `REPORT_e2e.md`.
