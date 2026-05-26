# Sorted — Test Documentation

## Type of Tests

All tests in this suite are **unit tests**.

A unit test:
- Calls a **single, isolated function** with known inputs
- Asserts the exact output
- Has **no side effects** — no network calls, no database, no UI rendering, no file system access
- Is **fast** — each test runs in milliseconds

These are also **white-box tests**, meaning they are written with knowledge of the internal logic — for example, testing the exact boundary values of the Mastercard 2221–2720 BIN range, or the `??` fallback chain in `getDomain`.

### What the unit tests do NOT cover

| Type | Description | Status |
|---|---|---|
| Integration tests | Service functions against a real/mocked Supabase client | ✅ Written — see `REPORT_unit.md` (services section) |
| Component tests | React Native component rendering and UI behaviour | ✅ Written — see `REPORT_components.md` |
| Screen tests | Full screen rendering with mocked dependencies | ✅ Written — see `REPORT_screens.md` |
| End-to-end tests | Full user flows on a real Android emulator (Detox) | ✅ Written — see `REPORT_e2e.md` |
| Edge function tests | `send-reminders` Supabase edge function (Deno test runner) | ✅ Written — see `supabase/functions/send-reminders/index.test.ts` |

---

## Running the Tests

```bash
npm test            # single run
npm run test:watch  # watch mode
```

---

## Test Files

### `constants/theme.test.ts`

**What is tested:** `withOpacity(hex, opacity)` — appends an 8-bit alpha channel to a hex colour token.

| Test | Description |
|---|---|
| opacity 0 → `00` alpha | `withOpacity("#C9A84C", 0)` returns `"#C9A84C00"` |
| opacity 1 → `ff` alpha | `withOpacity("#C9A84C", 1)` returns `"#C9A84Cff"` |
| opacity 0.5 → `80` alpha | `withOpacity("#C9A84C", 0.5)` returns `"#C9A84C80"` |
| clamp below 0 | Negative opacity is treated as 0 |
| clamp above 1 | Opacity > 1 is treated as 1 |
| output length | 6-digit hex + 2-digit alpha = 9 characters |
| zero alpha padding | Single hex digit is zero-padded to two digits |

---

### `lib/utils.test.ts`

**What is tested:** Three pure formatting functions in `lib/utils.ts`.

#### `formatCurrency(value, currency?)`

| Test | Description |
|---|---|
| Zero in EUR | Contains `"0.00"` and `"€"` |
| Decimal in EUR | `9.99` → contains `"9.99"` and `"€"` |
| Large amount | `1234.56` → contains `"1,234.56"` and `"€"` |
| USD | Result contains `"9.99"` |
| GBP | Result contains `"9.99"` |

#### `formatSubscriptionDateTime(value?)`

| Test | Description |
|---|---|
| `undefined` | Returns `"Not provided"` |
| Empty string | Returns `"Not provided"` |
| Valid ISO date | `"2024-03-15T00:00:00.000Z"` → `"03/15/2024"` |
| Date-only string | `"2024-01-01"` → `"01/01/2024"` |
| Unparseable string | `"not-a-date"` → `"Not provided"` |

#### `formatStatusLabel(value?)`

| Test | Description |
|---|---|
| `undefined` | Returns `"Unknown"` |
| Lowercase `"active"` | Returns `"Active"` |
| Lowercase `"cancelled"` | Returns `"Cancelled"` |
| Already capitalised | Passes through unchanged |
| Single character | `"a"` → `"A"` |

---

### `utils/cardUtils.test.ts`

**What is tested:** `detectCardType` and `formatExpiry` in `utils/cardUtils.ts`.

#### `detectCardType(number)`

Boundary values for the Mastercard 2-series BIN range (2221–2720) are explicitly tested.

| Test | Input | Expected |
|---|---|---|
| Visa prefix | `4111111111111111` | `"Visa"` |
| Mastercard 5-series | `5100000000000000` | `"Mastercard"` |
| Mastercard 2-series lower bound | `2221000000000000` | `"Mastercard"` |
| Mastercard 2-series upper bound | `2720000000000000` | `"Mastercard"` |
| 2-prefix below range | `2200000000000000` | `"Other"` |
| 2-prefix above range | `2721000000000000` | `"Other"` |
| Amex prefix | `3400000000000000` | `"Amex"` |
| Unknown prefix | `6011000000000000` | `"Other"` |

#### `formatExpiry(raw)`

| Test | Input | Expected |
|---|---|---|
| 2 digits unchanged | `"12"` | `"12"` |
| 1 digit unchanged | `"1"` | `"1"` |
| Full 4-digit input | `"1234"` | `"12/34"` |
| Partial year | `"123"` | `"12/3"` |
| Non-digit characters stripped | `"12ab34"` | `"12/34"` |
| Capped at 4 digits | `"12345678"` | `"12/34"` |
| Empty input | `""` | `""` |

---

### `utils/domainUtils.test.ts`

**What is tested:** `getDomain` and spot-checks on the `DOMAIN_OVERRIDES` lookup table in `utils/domainUtils.ts`.

#### `getDomain(name)`

The lookup has three fallback levels: exact match → first-word match → `firstword.com`.

| Test | Input | Expected |
|---|---|---|
| Unknown name → `.com` fallback | `"Netflix"` | `"netflix.com"` |
| Exact match, uppercased | `"Eir"` | `"eir.ie"` |
| Exact match, lowercase | `"eir"` | `"eir.ie"` |
| Multi-word exact match | `"bord gáis energy"` | `"bordgaisenergy.ie"` |
| Multi-word case-insensitive | `"Virgin Media"` | `"virginmedia.ie"` |
| Surrounding whitespace trimmed | `"  esb  "` | `"esb.ie"` |
| Unknown multi-word → `.com` fallback | `"some unknown service"` | `"some.com"` |
| First-word fallback | `"greyhound waste services"` | `"greyhound.ie"` |
| Irish accent character | `"uisce éireann"` | `"water.ie"` |

#### `DOMAIN_OVERRIDES` spot-checks

| Test | Keys verified |
|---|---|
| Irish energy suppliers | `esb`, `energia` |
| Telecoms | `eir`, `vodafone` |
| Gyms | `flyefit`, `puregym` |
| Banks | `aib`, `revolut` |

---

### `services/subscriptions.test.ts`

**What is tested:** `rowToSubscription` and `subscriptionToRow` in `services/subscriptions.ts` — the converters between the Supabase DB row format and the app's `Subscription` type.

#### `rowToSubscription(row)`

| Test | Description |
|---|---|
| `id` | Mapped directly from `row.id` |
| `name`, `price`, `currency`, `billing` | All mapped directly |
| `icon` | Set to `{ uri: row.icon_url }` |
| `startDate` | Mapped from `row.start_date` |
| `renewalDate` | Mapped from `row.renewal_date` |
| `category`, `status`, `frequency`, `color` | All mapped directly |

#### `subscriptionToRow(sub, userId, id?)`

| Test | Description |
|---|---|
| `user_id` | Matches the passed `userId` argument |
| `name`, `price`, `billing`, `currency` | All mapped directly |
| `icon_url` | Extracted from `sub.icon.uri` |
| `start_date` | Mapped from `sub.startDate` |
| `renewal_date` | Mapped from `sub.renewalDate` |
| `id` included | When third argument provided, `row.id` is set |
| `id` omitted | When no third argument, `row.id` is `undefined` |
| Currency default | `undefined` currency → `"EUR"` |
| Category default | `undefined` category → `"Other"` |
| Status default | `undefined` status → `"active"` |
| Non-URI icon | `icon_url` is `""` for non-object icon values |

---

## Results

```
Test Suites: 5 passed, 5 total
Tests:       66 passed, 66 total
Time:        ~11s
```
