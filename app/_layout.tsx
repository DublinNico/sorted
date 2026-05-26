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

function DataLoader() {
  const { isSignedIn, userId } = useAuth();
  const supabase = useSupabase();
  const { setSubscriptions, setLoading, resetSubscriptions } = useSubscriptionsStore();

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
        const [subs, token] = await Promise.all([
          fetchSubscriptions(supabase, userId),
          getExpoPushToken(),
        ]);
        if (cancelled) return;
        setSubscriptions(subs);
        if (token) {
          upsertPushToken(supabase, userId, token).catch(console.error);
        }
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
