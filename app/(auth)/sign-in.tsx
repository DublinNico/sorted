import React, { useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import SortedLogo from "@/components/SortedLogo";
import {
  authenticateWithBiometrics,
  getStoredCredentials,
  isBiometricsEnabled,
  isBiometricsSupported,
  saveCredentials,
  setBiometricsEnabled,
} from "@/utils/biometrics";

const safeArea = {
  flex: 1,
  backgroundColor: colors.background,
} as const;

/**
 * Render the multi-factor authentication screen that prompts the user to enter a 6-digit code sent to their email.
 *
 * @param email - The email address that received the verification code (displayed to the user).
 * @param code - The current verification code value shown in the input.
 * @param setCode - Callback invoked with the new code value when the input changes.
 * @param onVerify - Callback invoked when the user taps the "Verify Code" action.
 * @param onResend - Callback invoked when the user requests the code to be resent.
 * @param onReset - Callback invoked when the user chooses to use a different account.
 * @param isLoading - When true, disables actions and shows a loading indicator for the verify action.
 * @param codeError - Optional field-level error message for the code input.
 * @param errorMessage - Optional general error message displayed below the input.
 * @returns A React element rendering the MFA verification UI with inputs, status messages, and action buttons.
 */

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

/**
 * Renders a two-step "Forgot Password" UI that sends a reset code to an email and lets the user verify the code and choose a new password.
 *
 * The component manages sending the reset code, verifying the code, collecting a new password, and surfaces loading and error states for those steps.
 *
 * @param initialEmail - Email to prefill the email input
 * @param onBack - Callback invoked when the user chooses to go back to the sign-in screen
 * @param signIn - Clerk `signIn` instance used to create and attempt the reset-password flow
 * @returns The Forgot Password screen as a React element
 */

function ForgotPasswordScreen({
  initialEmail,
  onBack,
  signIn,
}: {
  initialEmail: string;
  onBack: () => void;
  signIn: NonNullable<ReturnType<typeof useSignIn>["signIn"]>;
}) {
  const [step, setStep]                       = useState<"email" | "verify">("email");
  const [resetEmail, setResetEmail]           = useState(initialEmail);
  const [code, setCode]                       = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");

  const handleSend = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: resetEmail });
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });
      if (result.status === "complete") {
        await finalize();
      } else {
        setError("Reset incomplete. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

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
            {step === "email" ? "Reset Password" : "Check your email"}
          </Text>
          <Text style={{ fontSize: 15, fontFamily: "sans-medium", color: colors.mutedForeground, marginBottom: 32 }}>
            {step === "email"
              ? "Enter your email and we'll send a reset code."
              : `Enter the code sent to ${resetEmail} and choose a new password.`}
          </Text>

          {step === "email" ? (
            <View style={{ gap: 6, marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Email</Text>
              <TextInput
                testID="reset-email-input"
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="john.doe@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  fontSize: 15,
                  fontFamily: "sans-medium",
                  color: colors.primary,
                }}
              />
            </View>
          ) : (
            <>
              <View style={{ gap: 6, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Reset Code</Text>
                <TextInput
                  testID="reset-code-input"
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
                    borderColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 16,
                    fontFamily: "sans-medium",
                    color: colors.primary,
                  }}
                />
              </View>
              <View style={{ gap: 6, marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>New Password</Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    testID="reset-new-password-input"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showNewPassword}
                    autoCorrect={false}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      paddingRight: 52,
                      fontSize: 15,
                      fontFamily: "sans-medium",
                      color: colors.primary,
                    }}
                  />
                  <Pressable
                    onPress={() => setShowNewPassword((v) => !v)}
                    hitSlop={8}
                    style={{ position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" }}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {!!error && (
            <Text style={{ fontSize: 13, fontFamily: "sans-medium", color: colors.destructive, textAlign: "center", marginBottom: 12 }}>
              {error}
            </Text>
          )}

          <Pressable
            testID="reset-action-button"
            onPress={step === "email" ? handleSend : handleReset}
            disabled={loading || (step === "email" ? !resetEmail.includes("@") : code.length < 6 || newPassword.length < 8)}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 12,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color={colors.background} size="small" />
              : <Text style={{ fontSize: 16, fontFamily: "sans-bold", color: colors.background }}>
                  {step === "email" ? "Send Reset Code" : "Reset Password"}
                </Text>
            }
          </Pressable>

          <Pressable onPress={onBack} style={{ alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-medium", color: colors.mutedForeground }}>
              Back to sign in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Renders the sign-in screen with email/password, optional biometric sign-in, MFA handling, and a forgot-password flow.
 *
 * The component manages local UI state (email, password, visibility toggles, MFA code, loading and error states),
 * performs password and biometric sign-in flows via the Clerk `useSignIn` hook, offers to enable biometrics after a
 * successful password sign-in, and conditionally renders MFA or forgot-password screens when required.
 *
 * @returns The sign-in screen React element.
 */

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail]                       = useState("");
  const [password, setPassword]                 = useState("");
  const [showPassword, setShowPassword]         = useState(false);
  const [code, setCode]                         = useState("");
  const [errorMessage, setErrorMessage]         = useState("");
  const [showBiometricBtn, setShowBiometricBtn] = useState(false);
  const [bioLoading, setBioLoading]             = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // ── Check if biometric sign-in is available ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const enabled = await isBiometricsEnabled();
        if (!enabled) return;
        const creds = await getStoredCredentials();
        if (!creds) return;
        const supported = await isBiometricsSupported();
        setShowBiometricBtn(supported);
      } catch {
        // silently ignore — biometrics simply won't show
      }
    })();
  }, []);

  if (!signIn) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isLoading = fetchStatus === "fetching";
  const canSubmit = email.includes("@") && email.includes(".") && password.length > 0 && !isLoading;

  // ── Finalize (complete) the sign-in attempt ──────────────────────────────────
  const finalize = async () => {
    const { error } = await signIn.finalize();
    if (error) setErrorMessage(error.longMessage ?? error.message ?? "Failed to complete sign in.");
  };

  // ── Offer to enable biometrics after a successful password sign-in ──────────
  const offerBiometrics = async (usedEmail: string, usedPassword: string) => {
    try {
      const supported = await isBiometricsSupported();
      if (!supported) return;
      const alreadyEnabled = await isBiometricsEnabled();
      if (alreadyEnabled) {
        // Silently refresh stored credentials in case password changed.
        await saveCredentials(usedEmail, usedPassword);
        return;
      }
      Alert.alert(
        "Enable Biometric Login",
        "Sign in faster next time using your fingerprint or Face ID.",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Enable",
            onPress: async () => {
              const authed = await authenticateWithBiometrics("Confirm to enable biometric login");
              if (authed) {
                await saveCredentials(usedEmail, usedPassword);
                await setBiometricsEnabled(true);
                setShowBiometricBtn(true);
              }
            },
          },
        ]
      );
    } catch {
      // non-fatal
    }
  };

  // ── Email + password sign-in ─────────────────────────────────────────────────
  const handleSignIn = async () => {
    setErrorMessage("");
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Sign in failed. Check your credentials.");
      return;
    }
    if (signIn.status === "complete") {
      await finalize();
      await offerBiometrics(email, password);
    } else if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
      const { error: mfaError } = await signIn.mfa.sendEmailCode();
      if (mfaError) setErrorMessage(mfaError.longMessage ?? mfaError.message ?? "Failed to send verification code.");
    } else {
      setErrorMessage(`Sign in incomplete (status: ${signIn.status}). Please try again.`);
    }
  };

  // ── Biometric sign-in ────────────────────────────────────────────────────────
  const handleBiometricSignIn = async () => {
    setBioLoading(true);
    setErrorMessage("");
    try {
      const authed = await authenticateWithBiometrics();
      if (!authed) return;

      const creds = await getStoredCredentials();
      if (!creds) {
        setShowBiometricBtn(false);
        setErrorMessage("No stored credentials. Please sign in with your password.");
        return;
      }

      const { error } = await signIn.password({ emailAddress: creds.email, password: creds.password });
      if (error) {
        setErrorMessage("Biometric sign-in failed. Please use your password.");
        // Disable biometrics — stored password is likely stale.
        await setBiometricsEnabled(false);
        setShowBiometricBtn(false);
        return;
      }

      if (signIn.status === "complete") {
        await finalize();
      } else if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        setEmail(creds.email);
        const { error: mfaError } = await signIn.mfa.sendEmailCode();
        if (mfaError) setErrorMessage(mfaError.longMessage ?? mfaError.message ?? "Failed to send code.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Biometric sign-in failed.");
    } finally {
      setBioLoading(false);
    }
  };

  // ── MFA verify ───────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setErrorMessage(error.longMessage ?? error.message ?? "Invalid code.");
      return;
    }
    if (signIn.status === "complete") await finalize();
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordScreen
        initialEmail={email}
        onBack={() => setShowForgotPassword(false)}
        signIn={signIn}
      />
    );
  }

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

          {/* ── Biometric sign-in button ─────────────────────────────────── */}
          {showBiometricBtn && (
            <Pressable
              testID="sign-in-biometric-button"
              onPress={handleBiometricSignIn}
              disabled={bioLoading || isLoading}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.accent + "60",
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {bioLoading
                ? <ActivityIndicator color={colors.accent} size="small" />
                : (
                  <>
                    <Ionicons name="finger-print-outline" size={22} color={colors.accent} />
                    <Text style={{ fontSize: 16, fontFamily: "sans-semibold", color: colors.accent }}>
                      Sign in with Biometrics
                    </Text>
                  </>
                )
              }
            </Pressable>
          )}

          {/* ── Divider (shown only when biometric button is visible) ─────── */}
          {showBiometricBtn && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ fontSize: 13, fontFamily: "sans-regular", color: colors.mutedForeground }}>
                or sign in with email
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
          )}

          {/* ── Email field ──────────────────────────────────────────────── */}
          <View style={{ gap: 6, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontFamily: "sans-semibold", color: colors.primary }}>Email</Text>
            <TextInput
              testID="sign-in-email"
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
                testID="sign-in-password"
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
            <Pressable testID="forgot-password-link" hitSlop={8} onPress={() => setShowForgotPassword(true)}>
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
            testID="sign-in-button"
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
              {"Don’t have an account?"}
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
