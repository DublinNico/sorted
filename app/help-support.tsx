import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactOption {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  action: () => void;
  trailingIcon: React.ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I add a new subscription?",
    answer: "Tap the + button on the home screen and fill in the details.",
  },
  {
    question: "Can I track utility bills?",
    answer: "Yes! Select \"Utility\" as the category when adding a subscription.",
  },
  {
    question: "How do I export my data?",
    answer: "Go to Settings > Profile > Export Data to download a CSV file.",
  },
  {
    question: "What payment methods are supported?",
    answer: "We support credit cards, debit cards, and PayPal.",
  },
  {
    question: "How do I cancel a subscription?",
    answer: "Open the subscription from your list, tap the three-dot menu, and select Cancel.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. All data is encrypted in transit and at rest. We never share your information with third parties.",
  },
];

/**
 * Renders a styled section header label.
 *
 * @param title - The text to display as the section header
 * @returns A React element containing the header text with muted styling and spacing
 */

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

/**
 * Render a touchable contact option row for the Help & Support screen.
 *
 * @param option - ContactOption describing the row's icon, title, subtitle, action handler, trailing icon and optional `disabled` flag
 * @returns A React element for the contact row; when `option.disabled` the row is non-interactive and visually dimmed
 */

function ContactRow({ option }: { option: ContactOption }) {
  return (
    <TouchableOpacity
      onPress={option.disabled ? undefined : option.action}
      activeOpacity={option.disabled ? 1 : 0.75}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 10,
        opacity: option.disabled ? 0.45 : 1,
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
        <Ionicons name={option.icon} size={20} color={colors.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-semibold", marginBottom: 2 }}>
          {option.title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "sans-regular" }}>
          {option.subtitle}
        </Text>
      </View>

      <Ionicons name={option.trailingIcon} size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

/**
 * Renders a card-like row displaying an FAQ question and its answer.
 *
 * @param item - The FAQ entry to render, containing `question` and `answer` strings.
 * @returns A React element containing the formatted FAQ question and answer.
 */

function FaqRow({ item }: { item: FaqItem }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-semibold" }}>
        {item.question}
      </Text>
      <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "sans-regular", lineHeight: 20 }}>
        {item.answer}
      </Text>
    </View>
  );
}

/**
 * Render the Help & Support screen containing contact options, frequently asked questions, and footer links.
 *
 * @returns The rendered React element for the Help & Support screen
 */

export default function HelpSupportScreen() {
  const router     = useRouter();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const CONTACT_OPTIONS: ContactOption[] = [
    {
      icon: "chatbubble-ellipses-outline",
      title: "Live Chat",
      subtitle: "Coming soon",
      action: () => {},
      trailingIcon: "chevron-forward",
      disabled: true,
    },
    {
      icon: "mail-outline",
      title: "Email Support",
      subtitle: "support@sorted.ie",
      action: () => Linking.openURL("mailto:support@sorted.ie"),
      trailingIcon: "open-outline",
    },
    {
      icon: "document-text-outline",
      title: "Documentation",
      subtitle: "Coming soon",
      action: () => {},
      trailingIcon: "chevron-forward",
      disabled: true,
    },
  ];

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
          Help & Support
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >

        {/* ── Contact options ─────────────────────────────────────────────── */}
        {CONTACT_OPTIONS.map((opt) => (
          <ContactRow key={opt.title} option={opt} />
        ))}

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <SectionHeader title="FREQUENTLY ASKED QUESTIONS" />
          {FAQ_ITEMS.map((item) => (
            <FaqRow key={item.question} item={item} />
          ))}
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 20,
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-semibold" }}>
            Sorted
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "sans-regular", marginBottom: 8 }}>
            Version {appVersion}
          </Text>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Pressable hitSlop={8} onPress={() => Linking.openURL("https://dublinnico.github.io/terms.html")}>
              <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "sans-semibold" }}>
                Terms of Service
              </Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => Linking.openURL("https://dublinnico.github.io/privacy.html")}>
              <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "sans-semibold" }}>
                Privacy Policy
              </Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
