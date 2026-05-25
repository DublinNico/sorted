import React, { useState } from "react";
import { useSignIn } from "@clerk/expo";
import { Link } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import SortedLogo from "@/components/SortedLogo";

const safeArea = {
  flex: 1,
  backgroundColor: colors.background,
} as const;

// ─── MFA screen ───────────────────────────────────────────────────────────────

function MfaScreen({
  email,
  code,
  setCode,
  onVerify,
  onResend,
  onReset,
  isLoading,
  codeError,
  errorMessage,
}: {
  email: string;
  code: string;
  setCode: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onReset: () => void;
  isLoading: boolean;
  codeError?: string;
  errorMessage?: string;
}) {
  return (
    <SafeAreaView style={safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand header */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <SortedLogo size={72} glow />
            <Text style={{ fontSize: 28, fontFamily: "sans-extrabold", color: colors.primary, marginTop: 16 }}>
              Sorted
            </Text>
          </View>

          <Text style={{ fontSize: 26, fontFamily: "sans-bold", color: colors.primary, marginBottom: 6 }}>
            Check your email
          </Text>
          <Text style={{ fontSize: 15, fontFamily: "sans-medium", color: colors.mutedForeground, marginBottom: 32 }}>
            We sent a 6-digit code to {email}
          </Text>

          <View style={{ gap: 6, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>
              Verification Code
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: codeError ? colors.destructive : colors.border,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                fontFamily: "sans-medium",
                color: colors.primary,
              }}
            />
            {!!codeError && (
              <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive }}>
                {codeError}
              </Text>
            )}
            {!!errorMessage && (
              <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive, textAlign: "center" }}>
                {errorMessage}
              </Text>
            )}
          </View>

          <Pressable
            onPress={onVerify}
            disabled={isLoading || !code}
            style={{
              backgroundColor: isLoading || !code ? colors.accent + "70" : colors.accent,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            {isLoading
              ? <ActivityIndicator color={colors.background} size="small" />
              : <Text style={{ fontSize: 16, fontFamily: "sans-bold", color: colors.background }}>Verify Code</Text>
            }
          </Pressable>

          <Pressable onPress={onResend} disabled={isLoading} style={{ alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.accent }}>Resend code</Text>
          </Pressable>

          <Pressable onPress={onReset} disabled={isLoading} style={{ alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-medium", color: colors.mutedForeground }}>
              Use a different account
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sign In screen ───────────────────────────────────────────────────────────

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode]                 = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!signIn) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isLoading = fetchStatus === "fetching";
  const canSubmit = email.includes("@") && email.includes(".") && password.length > 0 && !isLoading;

  const finalize = async () => {
    const { error } = await signIn.finalize();
    if (error) setErrorMessage(error.longMessage ?? error.message ?? "Failed to complete sign in.");
  };

  const handleSignIn = async () => {
    setErrorMessage("");
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Sign in failed. Check your credentials.");
      return;
    }
    if (signIn.status === "complete") {
      await finalize();
    } else if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
      const { error: mfaError } = await signIn.mfa.sendEmailCode();
      if (mfaError) setErrorMessage(mfaError.longMessage ?? mfaError.message ?? "Failed to send verification code.");
    } else {
      setErrorMessage(`Sign in incomplete (status: ${signIn.status}). Please try again.`);
    }
  };

  const handleVerify = async () => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Invalid code.");
      return;
    }
    if (signIn.status === "complete") await finalize();
  };

  if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
    return (
      <MfaScreen
        email={email}
        code={code}
        setCode={setCode}
        onVerify={handleVerify}
        onResend={async () => {
          const { error } = await signIn.mfa.sendEmailCode();
          if (error) setErrorMessage(error.longMessage ?? error.message ?? "Failed to resend code.");
        }}
        onReset={async () => {
          const { error } = await signIn.reset();
          if (error) setErrorMessage(error.longMessage ?? error.message ?? "Failed to reset sign in.");
        }}
        isLoading={isLoading}
        codeError={errors?.fields?.code?.message}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <SafeAreaView style={safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 48 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Brand header ─────────────────────────────────────────────── */}
          <View style={{ alignItems: "center", marginBottom: 44 }}>
            <SortedLogo size={72} glow />
            <Text style={{ fontSize: 28, fontFamily: "sans-extrabold", color: colors.primary, marginTop: 16 }}>
              Sorted
            </Text>
          </View>

          {/* ── Title + subtitle ─────────────────────────────────────────── */}
          <Text style={{ fontSize: 30, fontFamily: "sans-bold", color: colors.primary, marginBottom: 6 }}>
            Welcome Back
          </Text>
          <Text style={{ fontSize: 15, fontFamily: "sans-medium", color: colors.mutedForeground, marginBottom: 32 }}>
            Sign in to continue
          </Text>

          {/* ── Email field ──────────────────────────────────────────────── */}
          <View style={{ gap: 6, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setErrorMessage(""); }}
              placeholder="john.doe@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="next"
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: errors?.fields?.identifier ? colors.destructive : colors.border,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 15,
                fontFamily: "sans-medium",
                color: colors.primary,
              }}
            />
            {!!errors?.fields?.identifier?.message && (
              <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive }}>
                {errors.fields.identifier.message}
              </Text>
            )}
          </View>

          {/* ── Password field ───────────────────────────────────────────── */}
          <View style={{ gap: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMessage(""); }}
                placeholder="••••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={canSubmit ? handleSignIn : undefined}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: errors?.fields?.password ? colors.destructive : colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  paddingRight: 52,
                  fontSize: 15,
                  fontFamily: "sans-medium",
                  color: colors.primary,
                }}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={{ position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
            {!!errors?.fields?.password?.message && (
              <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive }}>
                {errors.fields.password.message}
              </Text>
            )}
          </View>

          {/* ── Forgot password ──────────────────────────────────────────── */}
          <View style={{ alignItems: "flex-end", marginBottom: 28 }}>
            <Pressable hitSlop={8}>
              <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.accent }}>
                Forgot Password?
              </Text>
            </Pressable>
          </View>

          {/* ── Error message ────────────────────────────────────────────── */}
          {!!errorMessage && (
            <Text style={{ fontSize: 13, fontFamily: "sans-medium", color: colors.destructive, textAlign: "center", marginBottom: 12 }}>
              {errorMessage}
            </Text>
          )}

          {/* ── Sign In button ───────────────────────────────────────────── */}
          <Pressable
            onPress={handleSignIn}
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? colors.accent : colors.accent + "70",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            {isLoading
              ? <ActivityIndicator color={colors.background} size="small" />
              : <Text style={{ fontSize: 16, fontFamily: "sans-bold", color: colors.background }}>Sign In</Text>
            }
          </Pressable>

          {/* ── Sign up link ─────────────────────────────────────────────── */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-medium", color: colors.mutedForeground }}>
              Don't have an account?
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text style={{ fontSize: 14, fontFamily: "sans-bold", color: colors.accent }}>Sign Up</Text>
              </Pressable>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
