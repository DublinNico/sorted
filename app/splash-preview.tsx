/**
 * app/splash-preview.tsx  —  DEV ONLY
 * Accessible from the Settings screen bottom button.
 * Remove before shipping to production.
 */

import AppSplashScreen from "@/components/AppSplashScreen";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Development-only screen that previews the application's splash UI with an overlay back button.
 *
 * Renders the splash preview and a safe-area-aware back button that navigates back when pressed.
 *
 * @returns The React element for the splash preview screen.
 *
 * @internal Dev-only; remove before production.
 */
export default function SplashPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <AppSplashScreen />
      {/* Back button overlay — tap to exit the preview */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 20,
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.card,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
      </Pressable>
    </View>
  );
}
