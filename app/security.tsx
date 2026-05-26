import { colors } from "@/constants/theme";
import {
  authenticateWithBiometrics,
  isBiometricsEnabled,
  isBiometricsSupported,
  setBiometricsEnabled,
} from "@/utils/biometrics";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 12,
        color: colors.mutedForeground,
        fontFamily: "sans-semibold",
        letterSpacing: 1.2,
        marginBottom: 12,
        marginTop: 4,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Password input ───────────────────────────────────────────────────────────

function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const [show, setShow] = useState(false);

  return (
    <View style={{ gap: 6, marginBottom: 14 }}>
      <Text style={{ fontSize: 14, color: colors.primary, fontFamily: "sans-semibold" }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.mutedForeground} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={!show}
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 15,
            fontFamily: "sans-medium",
            color: colors.primary,
          }}
        />
        <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Security option row ──────────────────────────────────────────────────────

function SecurityRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  testID,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: colors.accent + "20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-semibold" }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "sans-regular" }}>
          {description}
        </Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.background}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [saving, setSaving]                     = useState(false);
  const [biometric, setBiometric]               = useState(false);
  const [bioSupported, setBioSupported]         = useState(false);
  const [twoFactor, setTwoFactor]               = useState(false);

  // ── Load biometric state ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const supported = await isBiometricsSupported();
      setBioSupported(supported);
      if (supported) {
        const enabled = await isBiometricsEnabled();
        setBiometric(enabled);
      }
    })();
  }, []);

  // ── Toggle biometric login ──────────────────────────────────────────────────
  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      if (!bioSupported) {
        Alert.alert("Not Available", "Biometric authentication is not set up on this device.");
        return;
      }
      const authed = await authenticateWithBiometrics("Confirm to enable biometric login");
      if (!authed) return;
      await setBiometricsEnabled(true);
      setBiometric(true);
    } else {
      await setBiometricsEnabled(false);
      setBiometric(false);
    }
  };

  const canUpdate =
    currentPassword.length > 0 && newPassword.length >= 8 && !saving;

  const handleUpdatePassword = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await user.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Password updated", "Your password has been changed successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update password.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, color: colors.primary, fontFamily: "sans-bold" }}>
          Security
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <SectionHeader title="CHANGE PASSWORD" />

        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          icon="lock-closed-outline"
        />
        <PasswordInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          icon="key-outline"
        />

        <TouchableOpacity
          onPress={handleUpdatePassword}
          disabled={!canUpdate}
          activeOpacity={0.85}
          style={{
            backgroundColor: canUpdate ? colors.accent : colors.accent + "70",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          {saving
            ? <ActivityIndicator color={colors.background} size="small" />
            : <Text style={{ fontSize: 16, color: colors.background, fontFamily: "sans-bold" }}>
                Update Password
              </Text>
          }
        </TouchableOpacity>

        {/* ── Security Options ────────────────────────────────────────────── */}
        <SectionHeader title="SECURITY OPTIONS" />

        <SecurityRow
          icon="finger-print-outline"
          title="Biometric Login"
          description="Use fingerprint or face ID"
          value={biometric}
          onValueChange={handleBiometricToggle}
          testID="biometric-toggle"
        />
        <SecurityRow
          icon="shield-outline"
          title="Two-Factor Authentication"
          description="Add an extra layer of security"
          value={twoFactor}
          onValueChange={setTwoFactor}
        />

        {/* ── Data Privacy card ───────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 18,
            marginTop: 8,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16, color: colors.accent, fontFamily: "sans-bold" }}>
            Data Privacy
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "sans-regular", lineHeight: 20 }}>
            Your data is encrypted and stored securely. We never share your information with third parties.
          </Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "sans-semibold" }}>
              View Privacy Policy →
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
