/**
 * app/profile.tsx  —  Profile screen
 *
 * A full-screen stack screen pushed from the Settings tab when the user
 * taps the "Profile" row.
 *
 * Layout (top → bottom):
 *   1. Header row     — back chevron + "Profile" title
 *   2. Avatar card    — large gold initials circle, display name, email
 *   3. Edit name card — editable first name / last name fields, Save button
 *   4. Account info   — read-only email + member-since rows
 *
 * Data comes from Clerk's useUser() hook.
 * Name updates are persisted via user.update() (Clerk SDK).
 * The Save button is disabled until the user modifies at least one field
 * or while a save request is in flight.
 */

import "@/global.css";
import { colors } from "@/constants/theme";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * getInitials
 * Derives a 1–2 character initials string from the user object.
 * Priority: firstName + lastName → firstName only → email prefix → "?"
 */
const getInitials = (
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string => {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName)             return firstName[0].toUpperCase();
  if (email)                 return email[0].toUpperCase();
  return "?";
};

// ─── Profile screen ───────────────────────────────────────────────────────────

/**
 * ProfileScreen
 * Root component for the Profile stack screen.
 *
 * Initialises local state from the Clerk user object on mount.
 * Tracks whether the form values differ from the saved values so the
 * Save button is only enabled when there is actually something to save.
 */
const ProfileScreen = () => {
  const { user }  = useUser();
  const router    = useRouter();

  // ── Local editable state ────────────────────────────────────────────────────

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName,  setLastName]  = useState(user?.lastName  ?? "");
  const [isSaving,  setIsSaving]  = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [savedMsg,  setSavedMsg]  = useState(false);

  // Keep local state in sync if Clerk reloads the user (e.g. after a save).
  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName  ?? "");
  }, [user?.firstName, user?.lastName]);

  // ── Derived values ──────────────────────────────────────────────────────────

  /** True when the user has changed at least one field. */
  const isDirty =
    firstName.trim() !== (user?.firstName ?? "") ||
    lastName.trim()  !== (user?.lastName  ?? "");

  /** Primary email address. */
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  /** Display name shown below the avatar. */
  const displayName =
    [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
    email.split("@")[0] ||
    "User";

  /** Two-letter initials for the avatar circle. */
  const initials = getInitials(firstName, lastName, email);

  /** Formatted account creation date. */
  const memberSince = user?.createdAt
    ? dayjs(user.createdAt).format("MMMM YYYY")
    : "—";

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * handleSave
   * Persists firstName and lastName changes to Clerk.
   * Shows an inline error on failure and a brief success message on success.
   */
  const handleSave = async () => {
    if (!user || !isDirty || isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSavedMsg(false);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setSavedMsg(true);
      // Clear the success banner after 2 seconds.
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.longMessage ?? err?.message ?? "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        >

          {/* ── Header row ─────────────────────────────────────────────────── */}
          {/*
           * Manual header — the root Stack has headerShown: false so we
           * render our own back button + title row to stay on-theme.
           */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              accessibilityHint="Navigates to the previous screen"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.accent} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 24,
                color: colors.primary,
                fontFamily: "sans-bold",
              }}
            >
              Profile
            </Text>
          </View>

          {/* ── Avatar card ────────────────────────────────────────────────── */}
          {/*
           * Centred gold circle showing the user's current initials
           * (updates live as the first/last name fields are edited).
           */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {/* Gold avatar circle */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 30,
                  color: colors.background,
                  fontFamily: "sans-extrabold",
                }}
              >
                {initials}
              </Text>
            </View>

            {/* Display name */}
            <Text
              style={{
                fontSize: 20,
                color: colors.primary,
                fontFamily: "sans-bold",
                marginBottom: 4,
              }}
            >
              {displayName}
            </Text>

            {/* Email */}
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              {email}
            </Text>
          </View>

          {/* ── Edit name card ──────────────────────────────────────────────── */}
          {/*
           * First name and last name are the only Clerk user fields that
           * a standard integration can update directly via user.update().
           */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 20,
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: colors.primary,
                fontFamily: "sans-semibold",
              }}
            >
              Edit Profile
            </Text>

            {/* First name input */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.primary,
                  fontFamily: "sans-semibold",
                }}
              >
                First Name
              </Text>
              <TextInput
                value={firstName}
                onChangeText={(v) => { setFirstName(v); setErrorMsg(null); }}
                placeholder="First name"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="next"
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: colors.primary,
                  fontFamily: "sans-medium",
                }}
              />
            </View>

            {/* Last name input */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.primary,
                  fontFamily: "sans-semibold",
                }}
              >
                Last Name
              </Text>
              <TextInput
                value={lastName}
                onChangeText={(v) => { setLastName(v); setErrorMsg(null); }}
                placeholder="Last name"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="done"
                onSubmitEditing={isDirty ? handleSave : undefined}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: colors.primary,
                  fontFamily: "sans-medium",
                }}
              />
            </View>

            {/* Inline error message */}
            {!!errorMsg && (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.destructive,
                  fontFamily: "sans-medium",
                  textAlign: "center",
                }}
              >
                {errorMsg}
              </Text>
            )}

            {/* Inline success message */}
            {savedMsg && (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.success,
                  fontFamily: "sans-medium",
                  textAlign: "center",
                }}
              >
                Profile updated successfully.
              </Text>
            )}

            {/* Save button — disabled when nothing has changed or while saving */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isDirty || isSaving}
              activeOpacity={0.8}
              style={{
                backgroundColor: isDirty && !isSaving ? colors.accent : colors.accent + "45",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.background,
                    fontFamily: "sans-bold",
                  }}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Account info card ───────────────────────────────────────────── */}
          {/*
           * Read-only rows for fields the user cannot edit here
           * (email is managed by Clerk; member since is derived from createdAt).
           */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              paddingHorizontal: 16,
              overflow: "hidden",
            }}
          >
            {/* Email row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  fontFamily: "sans-regular",
                }}
              >
                Email
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontFamily: "sans-medium",
                  maxWidth: "65%",
                  textAlign: "right",
                }}
              >
                {email}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Member since row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  fontFamily: "sans-regular",
                }}
              >
                Member Since
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontFamily: "sans-medium",
                }}
              >
                {memberSince}
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
