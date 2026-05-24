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

const safeArea = { flex: 1, backgroundColor: colors.background } as const;

function BrandBlock() {
  return (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">S</Text>
        </View>
        <View>
          <Text className="auth-wordmark">SubTrack</Text>
          <Text className="auth-wordmark-sub">Smart Billing</Text>
        </View>
      </View>
    </View>
  );
}

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!signUp) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isLoading = fetchStatus === "fetching";
  const emailValid = email.includes("@") && email.includes(".");
  const passwordValid = password.length >= 8;
  const canSubmit =
    emailValid && passwordValid && confirmPassword.length > 0 &&
    password === confirmPassword && !isLoading;

  const finalize = async () => {
    await signUp.finalize({ navigate: () => {} });
  };

  const handleSignUp = async () => {
    setConfirmError("");
    setErrorMessage("");

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    const { error } = await signUp.password({
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
      return;
    }
  };

  const handleVerify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });

    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Invalid code.");
      return;
    }

    if (signUp.status === "complete") {
      await finalize();
    }
  };

  /* ── Email verification step ─────────────────────────────────────── */
  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <SafeAreaView style={safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingBottom: 40,
              paddingTop: 32,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <BrandBlock />

            <Text
              className="auth-title"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              Verify your email
            </Text>
            <Text className="auth-subtitle" style={{ alignSelf: "center" }}>
              We sent a 6-digit code to {email}
            </Text>

            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification Code</Text>
                  <TextInput
                    className={`auth-input${errors?.fields?.code ? " auth-input-error" : ""}`}
                    value={code}
                    onChangeText={setCode}
                    placeholder="000000"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  {!!errors?.fields?.code?.message && (
                    <Text className="auth-error">
                      {errors.fields.code.message}
                    </Text>
                  )}
                  {!!errorMessage && (
                    <Text className="auth-error" style={{ textAlign: "center" }}>
                      {errorMessage}
                    </Text>
                  )}
                </View>

                <Text className="auth-helper" style={{ textAlign: "center" }}>
                  Didn&apos;t receive it? Check your spam folder or request a
                  new one.
                </Text>

                <Pressable
                  className={`auth-button${isLoading || !code ? " auth-button-disabled" : ""}`}
                  onPress={handleVerify}
                  disabled={isLoading || !code}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text className="auth-button-text">Confirm Email</Text>
                  )}
                </Pressable>

                <View className="auth-divider-row">
                  <View className="auth-divider-line" />
                  <Text className="auth-divider-text">or</Text>
                  <View className="auth-divider-line" />
                </View>

                <Pressable
                  className="auth-secondary-button"
                  onPress={async () => {
                    const { error: resendError } = await signUp.verifications.sendEmailCode();
                    if (resendError) {
                      setErrorMessage(resendError.longMessage ?? resendError.message ?? "Failed to resend code.");
                    }
                  }}
                  disabled={isLoading}
                >
                  <Text className="auth-secondary-button-text">
                    Send new code
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  /* ── Registration form ───────────────────────────────────────────── */
  return (
    <SafeAreaView style={safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <BrandBlock />

          <Text
            className="auth-title"
            style={{ textAlign: "center", marginTop: 8 }}
          >
            Create account
          </Text>
          <Text className="auth-subtitle" style={{ alignSelf: "center" }}>
            Start tracking your subscriptions today
          </Text>

          <View className="auth-card">
            <View className="auth-form">
              {/* Email */}
              <View className="auth-field">
                <Text className="auth-label">Email</Text>
                <TextInput
                  className={`auth-input${errors?.fields?.emailAddress ? " auth-input-error" : ""}`}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrorMessage(""); }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {!!errors?.fields?.emailAddress?.message && (
                  <Text className="auth-error">
                    {errors.fields.emailAddress.message}
                  </Text>
                )}
              </View>

              {/* Password */}
              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    className={`auth-input${errors?.fields?.password ? " auth-input-error" : ""}`}
                    style={{ paddingRight: 52 }}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 16,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </View>
                {!!errors?.fields?.password?.message && (
                  <Text className="auth-error">
                    {errors.fields.password.message}
                  </Text>
                )}
                {password.length > 0 && !passwordValid && (
                  <Text className="auth-error">
                    Password must be at least 8 characters
                  </Text>
                )}
              </View>

              {/* Confirm password */}
              <View className="auth-field">
                <Text className="auth-label">Confirm Password</Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    className={`auth-input${confirmError ? " auth-input-error" : ""}`}
                    style={{ paddingRight: 52 }}
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      setConfirmError("");
                    }}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showConfirm}
                    autoComplete="new-password"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={canSubmit ? handleSignUp : undefined}
                  />
                  <Pressable
                    onPress={() => setShowConfirm((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 16,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </View>
                {!!confirmError && (
                  <Text className="auth-error">{confirmError}</Text>
                )}
              </View>

              {!!errorMessage && (
                <Text className="auth-error" style={{ textAlign: "center" }}>
                  {errorMessage}
                </Text>
              )}

              <Pressable
                className={`auth-button${!canSubmit ? " auth-button-disabled" : ""}`}
                onPress={handleSignUp}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text className="auth-button-text">Create Account</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text className="auth-link">Sign in</Text>
              </Pressable>
            </Link>
          </View>

          {/* Required: Clerk bot protection captcha */}
          <View nativeID="clerk-captcha" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
