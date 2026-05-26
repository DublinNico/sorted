---
name: feedback_dont_act_without_being_asked
description: Never make changes unless explicitly asked — especially to dependencies. Report findings and wait.
metadata:
  type: feedback
---

Never make changes unless the user explicitly asks for them. Report findings, state what you'd recommend, and wait for instruction.

**Why:** In a previous session I upgraded `react` to `19.2.6` without being asked, to silence a Clerk peer dependency warning. This caused a runtime crash (`react-native-renderer` version mismatch) that broke the app entirely. The user lost time the next day debugging it.

**How to apply:** This covers everything — dependency changes, config edits, code refactors. If something looks wrong, say so. Do not fix it until told to. Dependency version changes are especially dangerous: never touch `react`, `react-dom`, or `react-native` versions manually. Use `npx expo install` if the user asks to fix versions.