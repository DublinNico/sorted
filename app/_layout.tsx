import "@/global.css";
import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { SplashScreen, Stack, useRouter, useSegments, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/constants/theme";
import { PostHogProvider, usePostHog } from "posthog-react-native";

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

if (!posthogKey) throw new Error("Missing EXPO_PUBLIC_POSTHOG_KEY in your .env file");
if (!posthogHost) throw new Error("Missing EXPO_PUBLIC_POSTHOG_HOST in your .env file");

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file");
}

SplashScreen.preventAutoHideAsync().catch(console.error);

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

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-regular": require("../assets/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("../assets/assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("../assets/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <PostHogProvider apiKey={posthogKey} options={{ host: posthogHost }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ScreenTracker />
        <InitialLayout />
      </ClerkProvider>
    </PostHogProvider>
  );
}
