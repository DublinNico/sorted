# Sorted

A subscription and bill tracking app built with React Native and Expo. Sorted gives you a clear picture of your recurring payments — what you owe, when it's due, and how your spending is trending month over month.

---

## Screenshots

> Add screenshots to the `screenshots/` folder — see [`screenshots/PLACEHOLDER.md`](screenshots/PLACEHOLDER.md) for the full list and capture instructions.

| Home | Bills | Insights | Settings |
|------|-------|----------|----------|
| ![Home](screenshots/home.png) | ![Bills](screenshots/bills.png) | ![Insights](screenshots/insights.png) | ![Settings](screenshots/settings.png) |

| Sign In | Add Payment | Subscription Detail |
|---------|-------------|---------------------|
| ![Sign In](screenshots/sign-in.png) | ![Add Payment](screenshots/add-payment.png) | ![Detail](screenshots/subscription-detail.png) |

---

## Features

- **Home dashboard** — monthly spend total, active payment count, month-over-month change, due-soon cards, and a category breakdown donut chart
- **All Payments** — searchable, filterable list with category chips; expand any card to mark paid, edit, or cancel
- **Insights** — animated donut chart with category breakdown, 12-month spending trend bar chart driven by real Supabase snapshots
- **Add Payment modal** — global FAB accessible from any tab; supports recurring (weekly / monthly / annual) and one-off bills with icon picker, category, and renewal date
- **Push notifications** — daily reminders at 09:00 UTC via a Supabase Edge Function and pg_cron; configurable per-user lead times (1 / 3 / 7 days before due)
- **Biometric authentication** — Face ID / fingerprint lock via `expo-local-authentication`
- **Settings** — profile management, notification preferences, payment method management, security, and help & support
- **Dark green / gold design system** — custom theme built to a Figma high-fidelity mockup with Plus Jakarta Sans throughout

---

## Tech Stack

### Mobile

| Layer | Technology |
|-------|------------|
| Framework | [React Native](https://reactnative.dev/) `0.81` + [Expo](https://expo.dev/) `~54` |
| Routing | [Expo Router](https://expo.github.io/router/) `~6` (file-based, typed routes) |
| Styling | [NativeWind](https://www.nativewind.dev/) `^5` (Tailwind CSS v4 for React Native) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) `^5` |
| Auth | [Clerk](https://clerk.com/) via `@clerk/expo` |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) `~4` |
| Charts | Custom SVG (no external chart library) via `react-native-svg` |
| Notifications | `expo-notifications` + Expo Push API |
| Biometrics | `expo-local-authentication` |
| Analytics | [PostHog](https://posthog.com/) via `posthog-react-native` |
| Font | Plus Jakarta Sans (variable weight, loaded via `expo-font`) |

### Backend

| Layer | Technology |
|-------|------------|
| Database | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security) |
| Edge Functions | Deno (Supabase Edge Runtime) |
| Scheduled jobs | `pg_cron` + `pg_net` |
| Auth integration | Clerk JWT → Supabase RLS via `auth.jwt() ->> 'sub'` |

---

## Project Structure

```
sorted/
├── app/
│   ├── (auth)/                      # Auth flow (sign-in, sign-up)
│   ├── (tabs)/                      # Main tab navigator
│   │   ├── index.tsx                # Home screen
│   │   ├── subscriptions.tsx        # Bills / All Payments screen
│   │   ├── insights.tsx             # Insights screen
│   │   ├── settings.tsx             # Settings screen
│   │   └── _layout.tsx              # Tab bar + global Add Payment modal
│   ├── profile.tsx                  # Profile editor
│   ├── notifications.tsx            # Notification preferences
│   ├── payment-methods.tsx          # Payment methods management
│   ├── security.tsx                 # Security settings (biometrics, password)
│   └── help-support.tsx             # Help & Support
├── components/
│   ├── SubscriptionCard.tsx         # Expandable payment card
│   ├── CreateSubscriptionModal.tsx  # Add / Edit payment modal
│   ├── UpcommingSubscriptionCard.tsx
│   ├── CalendarPicker.tsx
│   ├── ListHeading.tsx
│   ├── SortedLogo.tsx
│   └── AppSplashScreen.tsx
├── constants/
│   └── theme.ts                     # Design tokens (colours, spacing, components)
├── services/                        # Supabase API wrappers
├── store/
│   └── subscriptionsStore.ts        # Zustand store
├── hooks/                           # useSupabase, useBiometrics, etc.
├── lib/                             # Shared utilities (formatCurrency, etc.)
├── supabase/
│   ├── schema.sql                   # Full database schema with RLS policies
│   └── functions/
│       └── send-reminders/          # Edge Function for push notifications
├── __tests__/                       # Full test suite (see Testing section)
├── assets/
│   ├── fonts/                       # Plus Jakarta Sans (6 weights)
│   └── icons/                       # Brand icons (Spotify, Netflix, Notion, etc.)
└── app.json
```

---

## Database Schema

Four tables, all with Row Level Security enforced via the Clerk JWT `sub` claim.

```sql
-- User subscriptions / bills
subscriptions (id, user_id, name, price, currency, billing, frequency,
               category, status, start_date, renewal_date, icon_url, color)

-- Expo push tokens per device
push_tokens (id, user_id, token, platform)

-- Per-user notification preferences
notification_preferences (id, user_id, enabled, days_before[])

-- Month-over-month spending history (drives the trend chart)
monthly_snapshots (id, user_id, year, month, total_amount)
```

All tables have `updated_at` triggers. `monthly_snapshots` enforces `unique(user_id, year, month)` so upserts are idempotent.

---

## Push Notifications

A Supabase Edge Function (`send-reminders`) runs at **09:00 UTC daily** via `pg_cron`:

1. Queries `notification_preferences` for users with notifications enabled
2. For each user, computes target dates from their `days_before` preference (default: 1, 3, 7 days before due)
3. Finds subscriptions whose `renewal_date` falls on a target date
4. Groups by days-until-due and composes grouped notification messages
5. Fetches Expo push tokens and sends in batches of 100 (Expo Push API limit)

To deploy:
```bash
supabase functions deploy send-reminders
```

To schedule (run in the Supabase SQL editor — replace `<SERVICE_ROLE_KEY>`):
```sql
select cron.schedule(
  'send-payment-reminders',
  '0 9 * * *',
  $$ select net.http_post(
       url     := 'https://<project>.supabase.co/functions/v1/send-reminders',
       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
       body    := '{}'::jsonb
     ) $$
);
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo`)
- An [Expo](https://expo.dev/) account (for EAS builds and push notifications)
- A [Clerk](https://clerk.com/) application (publishable key)
- A [Supabase](https://supabase.com/) project (apply `supabase/schema.sql` via the SQL editor)

### Environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_SUPABASE_PROJECT_ID=<your-project-id>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_POSTHOG_KEY=<your-posthog-key>
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
EXPO_PUBLIC_EAS_PROJECT_ID=<your-eas-project-id>
```

### Install and run

```bash
npm install

# Start Metro (press 'a' for Android, 'i' for iOS, 'w' for web)
npm start

# Or target a platform directly
npm run android
npm run ios
npm run web
```

---

## Testing

The test suite covers screens, components, services, store logic, and utilities.

### Unit and component tests

Uses **Jest** (`jest-expo` preset) + **React Testing Library for React Native**.

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

Test files live in `__tests__/` and mirror the source structure:

| Folder | What's covered |
|--------|----------------|
| `__tests__/screens/` | Home, Bills, Insights, Settings, Sign In, Sign Up, Notifications, Security, Payment Methods, Profile, Help & Support |
| `__tests__/components/` | SubscriptionCard, CreateSubscriptionModal, UpcommingSubscriptionCard, CalendarPicker, ListHeading |
| `__tests__/services/` | Subscriptions CRUD, notification preferences, push token management |
| `__tests__/store/` | Zustand subscriptions store actions and selectors |
| `__tests__/utils/` | cardUtils, domainUtils, notification helpers, biometrics |
| `__tests__/constants/` | Theme token values |
| `__tests__/lib/` | formatCurrency and other shared utilities |

### End-to-end tests (Detox)

Uses **Detox** targeting an Android emulator debug build.

```bash
# Build the debug APK and test APK
npm run e2e:build

# Run the full E2E suite
npm run e2e:test

# Run a single named test
npm run e2e:test:single "your test name"
```

Ensure an Android emulator is running before executing E2E tests (Detox config targets `android.emu.debug`).

---

## Design System

All visual tokens live in `constants/theme.ts`.

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0B3D2E` | Screen backgrounds (dark green) |
| `card` | `#0F4D39` | Card / surface backgrounds (medium green) |
| `primary` | `#F5F0E8` | Primary text (cream) |
| `accent` | `#C9A84C` | Gold — FAB, active tab, buttons, highlights |
| `mutedForeground` | `rgba(245,240,232,0.6)` | Secondary and placeholder text |
| `destructive` | `#d4183d` | Delete / error actions |
| `success` | `#16a34a` | Paid / success states |

**Font:** Plus Jakarta Sans in six weights (Light → ExtraBold), loaded at startup via `expo-font`.

**Spacing:** 4-pt grid (`spacing[1]` = 4px … `spacing[30]` = 120px).

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Production-ready, stable releases |
| `dev` | Active development — all PRs target this branch |

---

## License

Private — all rights reserved.
