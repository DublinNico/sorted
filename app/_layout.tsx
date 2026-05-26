import "@/global.css";
import { colors } from "@/constants/theme";
import { setBackgroundColorAsync } from "expo-system-ui";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { SplashScreen, Stack, useRouter, useSegments, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import AppSplashScreen from "@/components/AppSplashScreen";
import { useSupabase } from "@/hooks/useSupabase";
import { fetchSubscriptions } from "@/services/subscriptions";
import { upsertPushToken } from "@/services/pushTokens";
import { fetchMonthlySnapshots, upsertMonthlySnapshot } from "@/services/monthlySnapshots";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";
import {
  configureNotificationHandler,
  setupAndroidChannel,
  getExpoPushToken,
} from "@/utils/notifications";

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.card,
    text: colors.primary,
    border: colors.border,
    notification: colors.accent,
  },
};

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

if (!posthogKey) throw new Error("Missing EXPO_PUBLIC_POSTHOG_KEY in your .env file");
if (!posthogHost) throw new Error("Missing EXPO_PUBLIC_POSTHOG_HOST in your .env file");

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file");
}

SplashScreen.preventAutoHideAsync().catch(console.error);
setBackgroundColorAsync(colors.background).catch(console.error);

configureNotificationHandler();

function ScreenTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();
  const { user } = useUser();

  useEffect(() => {
    posthog.screen(pathname);
  }, [pathname]);

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress ?? null,
        name: user.fullName ?? null,
      });
    }
  }, [user]);

  return null;
}

/**
 * Loads and persists user-specific data into the subscriptions store when a user is signed in.
 *
 * While mounted and signed in, triggers setup of the Android notification channel, fetches
 * subscriptions, the device push token, and monthly snapshots in parallel, then updates the
 * subscriptions store with the fetched subscriptions and snapshots. If a push token is available
 * it is upserted; the current month's total is computed from subscription prices and upserted as a
 * monthly snapshot. Errors are logged to the console; loading state is set while the operation runs.
 *
 * @returns Null (renders nothing)
 */
function DataLoader() {
  const { isSignedIn, userId } = useAuth();
  const supabase = useSupabase();
  const { setSubscriptions, setLoading, resetSubscriptions, setMonthlySnapshots } = useSubscriptionsStore();

  useEffect(() => {
    if (!isSignedIn || !userId) {
      resetSubscriptions();
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await setupAndroidChannel();
        const [subs, token, snapshots] = await Promise.all([
          fetchSubscriptions(supabase, userId),
          getExpoPushToken(),
          fetchMonthlySnapshots(supabase, userId),
        ]);
        if (cancelled) return;
        setSubscriptions(subs);
        setMonthlySnapshots(snapshots);
        if (token) {
          upsertPushToken(supabase, userId, token).catch(console.error);
        }
        const now = new Date();
        const total = subs.reduce((sum, s) => sum + s.price, 0);
        upsertMonthlySnapshot(supabase, userId, now.getFullYear(), now.getMonth() + 1, total).catch(console.error);
      } catch (err) {
        console.error("DataLoader error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isSignedIn, userId]);

  return null;
}

/**
 * Render the app's initial layout and perform sign-in based routing.
 *
 * Performs client-side redirects once authentication state is loaded:
 * - If the first segment is `"splash-preview"`, no redirect is performed.
 * - If the user is signed in and the current segment group is `(auth)`, replaces the route with `/(tabs)`.
 * - If the user is not signed in and not in the `(auth)` group, replaces the route with `/(auth)/sign-in`.
 *
 * While auth state is still loading, renders the app splash screen. When loaded, provides the themed
 * navigation stack with header hidden, animations disabled, and the app background color applied.
 *
 * @returns The root layout element containing the themed navigation stack or the splash screen while loading.
 */
function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Never redirect away from the dev splash preview screen.
    if (segments[0] === "splash-preview") return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return <AppSplashScreen />;
  }

  return (
    <ThemeProvider value={AppTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </ThemeProvider>
  );
}

/**
 * Application root layout that ensures fonts and a minimum 2-second splash are ready, then mounts global providers and app-level loaders.
 *
 * While mounting, it waits for required fonts to load and enforces a 2-second minimum splash delay; once ready it hides the native splash and renders analytics, authentication, and navigation providers along with screen-tracking and data-loading helpers.
 *
 * @returns The root React element tree containing PostHog and Clerk providers, plus ScreenTracker, DataLoader, and InitialLayout components.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-regular":   require("../assets/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold":      require("../assets/assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium":    require("../assets/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold":  require("../assets/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light":     require("../assets/assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  // Enforce a minimum 2-second splash so the animation is always visible.
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinDelayPassed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded && minDelayPassed;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <AppSplashScreen />;

  return (
    <PostHogProvider apiKey={posthogKey} options={{ host: posthogHost }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ScreenTracker />
        <DataLoader />
        <InitialLayout />
      </ClerkProvider>
    </PostHogProvider>
  );
}
