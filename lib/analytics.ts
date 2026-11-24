import { usePostHog } from "posthog-react-native";

/** PostHog analytics is optional: it is only enabled when a key is configured in .env. */
export const posthogEnabled = Boolean(process.env.EXPO_PUBLIC_POSTHOG_KEY);

/**
 * Returns the PostHog client, or undefined when analytics is disabled.
 * The choice is made once at module load, so the hook order never changes between renders.
 */
export const useAnalytics: () => ReturnType<typeof usePostHog> | undefined = posthogEnabled
  ? usePostHog
  : () => undefined;
