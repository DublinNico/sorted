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

const safeArea = {
  flex: 1,
  backgroundColor: colors.background,
} as const;

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
            Check your email
          </Text>
          <Text className="auth-subtitle" style={{ alignSelf: "center" }}>
            We sent a 6-digit code to {email}
          </Text>

          <View className="auth-card">
            <View className="auth-form">
              <View className="auth-field">
                <Text className="auth-label">Verification Code</Text>
                <TextInput
                  className={`auth-input${codeError ? " auth-input-error" : ""}`}
                  value={code}
                  onChangeText={setCode}
                  placeholder="000000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                {!!codeError && (
                  <Text className="auth-error">{codeError}</Text>
                )}
                {!!errorMessage && (
                  <Text className="auth-error" style={{ textAlign: "center" }}>
                    {errorMessage}
                  </Text>
                )}
              </View>

              <Pressable
                className={`auth-button${isLoading || !code ? " auth-button-disabled" : ""}`}
                onPress={onVerify}
                disabled={isLoading || !code}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text className="auth-button-text">Verify Code</Text>
                )}
              </Pressable>

              <View className="auth-divider-row">
                <View className="auth-divider-line" />
                <Text className="auth-divider-text">or</Text>
                <View className="auth-divider-line" />
              </View>

              <Pressable
                className="auth-secondary-button"
                onPress={onResend}
                disabled={isLoading}
              >
                <Text className="auth-secondary-button-text">Resend code</Text>
              </Pressable>

              <Pressable
                className="auth-secondary-button"
                onPress={onReset}
                disabled={isLoading}
              >
                <Text className="auth-secondary-button-text">
                  Use a different account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!signIn) {
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
  const canSubmit =
    email.includes("@") && email.includes(".") && password.length > 0 && !isLoading;

  const finalize = async () => {
    const { error } = await signIn.finalize();
    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Failed to complete sign in.");
    }
  };

  const handleSignIn = async () => {
    setErrorMessage("");
    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });

    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Sign in failed. Check your credentials.");
      return;
    }

    if (signIn.status === "complete") {
      await finalize();
    } else if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const { error: mfaError } = await signIn.mfa.sendEmailCode();
      if (mfaError) {
        setErrorMessage(mfaError.longMessage ?? mfaError.message ?? "Failed to send verification code.");
        return;
      }
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
            Welcome back
          </Text>
          <Text className="auth-subtitle" style={{ alignSelf: "center" }}>
            Sign in to continue managing your subscriptions
          </Text>

          <View className="auth-card">
            <View className="auth-form">
              <View className="auth-field">
                <Text className="auth-label">Email</Text>
                <TextInput
                  className={`auth-input${errors?.fields?.identifier ? " auth-input-error" : ""}`}
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
                {!!errors?.fields?.identifier?.message && (
                  <Text className="auth-error">
                    {errors.fields.identifier.message}
                  </Text>
                )}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    className={`auth-input${errors?.fields?.password ? " auth-input-error" : ""}`}
                    style={{ paddingRight: 52 }}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setErrorMessage(""); }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={canSubmit ? handleSignIn : undefined}
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
              </View>

              {!!errorMessage && (
                <Text className="auth-error" style={{ textAlign: "center" }}>
                  {errorMessage}
                </Text>
              )}

              <Pressable
                className={`auth-button${!canSubmit ? " auth-button-disabled" : ""}`}
                onPress={handleSignIn}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text className="auth-button-text">Sign In</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">New here?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text className="auth-link">Create an account</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
