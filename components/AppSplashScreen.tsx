import { colors } from "@/constants/theme";
import SortedLogo from "@/components/SortedLogo";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Text, View } from "react-native";

/**
 * AppSplashScreen
 * Shown while fonts / auth are loading and during the minimum display window.
 * Also rendered by app/splash-preview.tsx for dev inspection.
 */
const AppSplashScreen = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  // useNativeDriver is not supported on web.
  const nativeDriver = Platform.OS !== "web";

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1,   duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: nativeDriver }),
          Animated.timing(val, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: nativeDriver }),
          Animated.delay(400),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 180);
    const a3 = pulse(dot3, 360);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Brand logo with gold glow */}
      <View style={{ marginBottom: 28 }}>
        <SortedLogo size={96} glow />
      </View>

      {/* App name */}
      <Text
        style={{
          fontSize: 40,
          color: colors.primary,
          fontFamily: "sans-extrabold",
          letterSpacing: 0.5,
          marginBottom: 10,
        }}
      >
        Sorted
      </Text>

      {/* — IE — divider */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          width: 160,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: colors.accent }} />
        <Text
          style={{
            fontSize: 12,
            color: colors.accent,
            fontFamily: "sans-semibold",
            letterSpacing: 2,
          }}
        >
          IE
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.accent }} />
      </View>

      {/* Tagline */}
      <Text
        style={{
          fontSize: 18,
          color: colors.primary,
          fontFamily: "sans-semibold",
          marginBottom: 8,
        }}
      >
        Manage Your Payments
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          fontSize: 13,
          color: colors.mutedForeground,
          fontFamily: "sans-regular",
          textAlign: "center",
          paddingHorizontal: 48,
          lineHeight: 20,
          marginBottom: 48,
        }}
      >
        Less stress. More control.
      </Text>

      {/* Three pulsing dots */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.accent,
              opacity: dot,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default AppSplashScreen;
