import React, { useState } from "react";
import { useSignUp } from "@clerk/expo";
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

const safeArea = { flex: 1, backgroundColor: colors.background } as const;

const inputStyle = (hasError?: boolean) => ({
  backgroundColor: colors.card,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: hasError ? colors.destructive : colors.border,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 15,
  fontFamily: "sans-medium",
  color: colors.primary,
} as const);

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();

  const [fullName,         setFullName]         = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [code,             setCode]             = useState("");
  const [confirmError,     setConfirmError]     = useState("");
  const [errorMessage,     setErrorMessage]     = useState("");

  if (!signUp) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isLoading    = fetchStatus === "fetching";
  const emailValid   = email.includes("@") && email.includes(".");
  const passwordValid = password.length >= 8;
  const canSubmit    =
    fullName.trim().length > 0 &&
    emailValid &&
    passwordValid &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    !isLoading;

  // Split "First Last" → firstName / lastName for Clerk.
  const parseName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return {
      firstName: parts[0] ?? "",
      lastName:  parts.slice(1).join(" ") ?? "",
    };
  };

  const finalize = async () => {
    try {
      await signUp.finalize({ navigate: () => {} });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Sign up finalization failed.");
    }
  };

  const handleSignUp = async () => {
    setConfirmError("");
    setErrorMessage("");

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    const { firstName, lastName } = parseName(fullName);

    const { error } = await signUp.create({
      firstName,
      lastName,
      emailAddress: email,
      password,
    });

    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Sign up failed.");
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setErrorMessage(sendError.longMessage ?? sendError.message ?? "Failed to send verification email.");
    }
  };

  const handleVerify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Invalid code.");
      return;
    }
    if (signUp.status === "complete") await finalize();
  };

  // ── Email verification step ─────────────────────────────────────────────────
  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <SafeAreaView style={safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", marginBottom: 40 }}>
              <SortedLogo size={72} glow />
              <Text style={{ fontSize: 28, fontFamily: "sans-extrabold", color: colors.primary, marginTop: 16 }}>
                Sorted
              </Text>
            </View>

            <Text style={{ fontSize: 26, fontFamily: "sans-bold", color: colors.primary, marginBottom: 6 }}>
              Verify your email
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
                style={inputStyle(!!errors?.fields?.code)}
              />
              {!!errors?.fields?.code?.message && (
                <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive }}>
                  {errors.fields.code.message}
                </Text>
              )}
              {!!errorMessage && (
                <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive, textAlign: "center" }}>
                  {errorMessage}
                </Text>
              )}
            </View>

            <Text style={{ fontSize: 13, fontFamily: "sans-medium", color: colors.mutedForeground, textAlign: "center", marginBottom: 20 }}>
              {"Didn’t receive it? Check your spam folder."}
            </Text>

            <Pressable
              onPress={handleVerify}
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
                : <Text style={{ fontSize: 16, fontFamily: "sans-bold", color: colors.background }}>Confirm Email</Text>
              }
            </Pressable>

            <Pressable
              onPress={async () => {
                const { error: resendError } = await signUp.verifications.sendEmailCode();
                if (resendError) setErrorMessage(resendError.longMessage ?? resendError.message ?? "Failed to resend code.");
              }}
              disabled={isLoading}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.accent }}>Send new code</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 48 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Brand header ───────────────────────────────────────────── */}
          <View style={{ alignItems: "center", marginBottom: 44 }}>
            <SortedLogo size={72} glow />
            <Text style={{ fontSize: 28, fontFamily: "sans-extrabold", color: colors.primary, marginTop: 16 }}>
              Sorted
            </Text>
          </View>

          {/* ── Title + subtitle ───────────────────────────────────────── */}
          <Text style={{ fontSize: 30, fontFamily: "sans-bold", color: colors.primary, marginBottom: 6 }}>
            Create Account
          </Text>
          <Text style={{ fontSize: 15, fontFamily: "sans-medium", color: colors.mutedForeground, marginBottom: 32 }}>
            Start tracking your payments today
          </Text>

          {/* ── Full name ──────────────────────────────────────────────── */}
          <View style={{ gap: 6, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={(v) => { setFullName(v); setErrorMessage(""); }}
              placeholder="John Doe"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              returnKeyType="next"
              style={inputStyle()}
            />
          </View>

          {/* ── Email ──────────────────────────────────────────────────── */}
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
              style={inputStyle(!!errors?.fields?.emailAddress)}
            />
            {!!errors?.fields?.emailAddress?.message && (
              <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive }}>
                {errors.fields.emailAddress.message}
              </Text>
            )}
          </View>

          {/* ── Password ───────────────────────────────────────────────── */}
          <View style={{ gap: 6, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                autoCorrect={false}
                returnKeyType="next"
                style={[inputStyle(!!errors?.fields?.password), { paddingRight: 52 }]}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={{ position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" }}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {password.length > 0 && !passwordValid && (
              <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive }}>
                Password must be at least 8 characters
              </Text>
            )}
          </View>

          {/* ── Confirm password ───────────────────────────────────────── */}
          <View style={{ gap: 6, marginBottom: 28 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Confirm Password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setConfirmError(""); }}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showConfirm}
                autoComplete="new-password"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={canSubmit ? handleSignUp : undefined}
                style={[inputStyle(!!confirmError), { paddingRight: 52 }]}
              />
              <Pressable
                onPress={() => setShowConfirm((v) => !v)}
                hitSlop={8}
                style={{ position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" }}
              >
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {!!confirmError && (
              <Text style={{ fontSize: 12, fontFamily: "sans-medium", color: colors.destructive }}>{confirmError}</Text>
            )}
          </View>

          {/* ── Error message ──────────────────────────────────────────── */}
          {!!errorMessage && (
            <Text style={{ fontSize: 13, fontFamily: "sans-medium", color: colors.destructive, textAlign: "center", marginBottom: 12 }}>
              {errorMessage}
            </Text>
          )}

          {/* ── Create Account button ──────────────────────────────────── */}
          <Pressable
            onPress={handleSignUp}
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
              : <Text style={{ fontSize: 16, fontFamily: "sans-bold", color: colors.background }}>Create Account</Text>
            }
          </Pressable>

          {/* ── Sign in link ───────────────────────────────────────────── */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-medium", color: colors.mutedForeground }}>
              Already have an account?
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text style={{ fontSize: 14, fontFamily: "sans-bold", color: colors.accent }}>Sign in</Text>
              </Pressable>
            </Link>
          </View>

          <View nativeID="clerk-captcha" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
