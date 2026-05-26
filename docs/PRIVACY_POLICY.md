# Privacy Policy

**App name:** Sorted  
**Last updated:** 26 May 2025  
**Contact:** support@sorted.ie

---

## 1. Who We Are

Sorted ("we", "us", "our") is a subscription and bill tracking application. We are the data controller responsible for your personal data under the EU General Data Protection Regulation (GDPR) and the Irish Data Protection Acts 1988–2018.

If you have any questions about how we handle your data, contact us at **support@sorted.ie**.

---

## 2. What Data We Collect

### 2.1 Account Data
When you create an account we collect:
- Your **email address**
- Your **password** (stored as a secure hash — we never store your password in plain text)
- Your **display name**, if you choose to provide one

### 2.2 Subscription Data
Data you enter into the app about your subscriptions and bills:
- Service name, price, billing frequency, and currency
- Renewal and start dates
- Category and status
- Service logo (fetched from a public domain lookup — no personal data)

This data is stored on our behalf by Supabase (see Section 5).

### 2.3 Push Notification Token
If you grant notification permission, we store a **device push token** issued by Expo's push notification service. This token is used solely to deliver renewal reminders to your device. It does not identify you personally.

### 2.4 Biometric Preference
We store a single boolean flag indicating whether you have enabled biometric login (Face ID / fingerprint). We do **not** collect, store, or transmit any biometric data. Biometric verification is performed entirely on your device by the operating system.

### 2.5 Usage Analytics
We collect anonymised analytics data including:
- Screens visited
- Feature interactions (e.g. subscription added, notification toggled)
- App version and device type

Analytics are collected via PostHog and used only to understand how users interact with the app in order to improve it. No analytics data is sold or shared with advertisers.

---

## 3. How We Use Your Data

| Data | Purpose | Legal Basis |
|---|---|---|
| Email address and password | Account creation and authentication | Performance of a contract (Art. 6(1)(b) GDPR) |
| Subscription data | Core app functionality — tracking your bills | Performance of a contract (Art. 6(1)(b) GDPR) |
| Push notification token | Sending renewal reminders you have opted into | Consent (Art. 6(1)(a) GDPR) |
| Biometric preference flag | Enabling biometric login on your device | Performance of a contract (Art. 6(1)(b) GDPR) |
| Usage analytics | Improving the app | Legitimate interests (Art. 6(1)(f) GDPR) |

We do not use your data for advertising, profiling, or automated decision-making.

---

## 4. Data Retention

| Data | Retention period |
|---|---|
| Account and subscription data | Retained for as long as your account is active. Deleted within 30 days of account deletion. |
| Push notification token | Deleted when you disable notifications or delete your account. |
| Analytics events | Retained for 12 months, then automatically deleted by PostHog. |

---

## 5. Third-Party Services (Sub-processors)

We share your data with the following trusted third-party services solely to provide the app's functionality. We have data processing agreements in place with each.

| Service | Purpose | Location | Privacy information |
|---|---|---|---|
| **Clerk** | User authentication (sign-up, sign-in, password reset) | United States (SCCs apply) | [clerk.com/privacy](https://clerk.com/privacy) |
| **Supabase** | Database storage for subscription data and push tokens | European Union | [supabase.com/privacy](https://supabase.com/privacy) |
| **PostHog** | Product analytics | European Union (EU-hosted instance) | [posthog.com/privacy](https://posthog.com/privacy) |
| **Expo** | Push notification delivery | United States (SCCs apply) | [expo.dev/privacy](https://expo.dev/privacy) |

We do not sell your personal data to any third party.

---

## 6. Your Rights Under GDPR

As a data subject you have the following rights:

- **Right of access** — request a copy of the personal data we hold about you
- **Right to rectification** — correct inaccurate data
- **Right to erasure** — request deletion of your account and all associated data
- **Right to restriction** — ask us to restrict processing of your data
- **Right to data portability** — receive your data in a structured, machine-readable format
- **Right to object** — object to processing based on legitimate interests (e.g. analytics)
- **Right to withdraw consent** — withdraw notification consent at any time in the app settings

To exercise any of these rights, email **support@sorted.ie**. We will respond within 30 days.

You also have the right to lodge a complaint with the Irish Data Protection Commission (DPC) at [dataprotection.ie](https://www.dataprotection.ie).

---

## 7. Push Notifications

Push notifications are entirely optional. You can enable or disable them at any time in **Settings → Notifications**. Disabling notifications removes your push token from our servers. We will never send you marketing messages via push notifications — they are used only to remind you of upcoming subscription renewals.

---

## 8. Children

Sorted is not directed at children under the age of 16. We do not knowingly collect personal data from anyone under 16. If you believe a child has provided us with personal data, contact us at **support@sorted.ie** and we will delete it promptly.

---

## 9. Security

We implement appropriate technical and organisational measures to protect your data:
- All data in transit is encrypted via TLS
- Data at rest is encrypted by Supabase
- Authentication is managed by Clerk, which is SOC 2 Type II certified
- Biometric data never leaves your device

No method of transmission or storage is 100% secure. If you become aware of a security issue, please contact **support@sorted.ie**.

---

## 10. Changes to This Policy

We may update this policy from time to time. When we make material changes we will update the "Last updated" date at the top of this document and, where appropriate, notify you via the app. Continued use of Sorted after a change constitutes acceptance of the updated policy.

---

## 11. Contact

**Email:** support@sorted.ie  
**App:** Sorted — Subscription Tracker

For complaints or data subject requests, email us and we will respond within 30 days.
