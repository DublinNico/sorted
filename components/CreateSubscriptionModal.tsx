import "@/global.css";
import clsx from "clsx";
import dayjs from "dayjs";
import { usePostHog } from "posthog-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const DOMAIN_OVERRIDES: Record<string, string> = {
  // Energy
  esb: "esb.ie",
  "electric ireland": "electricireland.ie",
  energia: "energia.ie",
  "sse airtricity": "sseairtricity.com",
  airtricity: "sseairtricity.com",
  "bord gais energy": "bordgaisenergy.ie",
  "bord gáis energy": "bordgaisenergy.ie",
  "bord gais": "bordgaisenergy.ie",
  "bord gáis": "bordgaisenergy.ie",
  prepaypower: "prepaypower.ie",
  "prepay power": "prepaypower.ie",
  pinergy: "pinergy.ie",
  flogas: "flogas.ie",
  "community power": "communitypower.ie",
  waterpower: "waterpower.ie",
  "water power": "waterpower.ie",
  "yuno energy": "yunoenergy.ie",
  yuno: "yunoenergy.ie",
  "go power": "gopower.ie",
  // Water
  "uisce éireann": "water.ie",
  "uisce eireann": "water.ie",
  "irish water": "water.ie",
  // Telecoms
  eir: "eir.ie",
  vodafone: "vodafone.com",
  "vodafone ireland": "vodafone.com",
  "virgin media": "virginmedia.ie",
  sky: "sky.com",
  "sky ireland": "sky.com",
  three: "three.ie",
  "three ireland": "three.ie",
  "pure telecom": "puretelecom.ie",
  digiweb: "digiweb.ie",
  imagine: "imagine.ie",
  siro: "siro.ie",
  // Waste
  greyhound: "greyhound.ie",
  panda: "panda.ie",
  "thorntons recycling": "thorntons-recycling.ie",
  thorntons: "thorntons-recycling.ie",
  "city bin co": "citybin.com",
  "city bin": "citybin.com",
  oxigen: "oxigen.ie",
  kwd: "kwd.ie",
  // Banks & Finance
  aib: "aib.ie",
  "bank of ireland": "bankofireland.com",
  "permanent tsb": "permanenttsb.ie",
  ptsb: "permanenttsb.ie",
  "an post money": "anpost.ie",
  "avant money": "avantmoney.ie",
  ebs: "ebs.ie",
  revolut: "revolut.com",
  n26: "n26.com",
  bunq: "bunq.com",
  // Insurance
  aviva: "aviva.ie",
  zurich: "zurich.ie",
  axa: "axa.ie",
  allianz: "allianz.ie",
  fbd: "fbd.ie",
  "liberty insurance": "libertymutual.com",
  rsa: "rsagroup.com",
  vhi: "vhi.ie",
  "laya healthcare": "layahealthcare.ie",
  laya: "layahealthcare.ie",
  "irish life health": "irishlifehealth.ie",
  "irish life": "irishlife.ie",
  // Government & Services
  "an post": "anpost.ie",
  "revenue commissioners": "revenue.ie",
  "local property tax": "revenue.ie",
  "motor tax": "motortax.ie",
  "residential tenancies board": "rtb.ie",
  rtb: "rtb.ie",
  // Housing
  "tuath housing": "tuathhousing.ie",
  tuath: "tuathhousing.ie",
  // Estate Agents
  dng: "dng.ie",
  "sherry fitzgerald": "sherryfitz.ie",
  "hooke & macdonald": "hookemacdonald.ie",
  "hooke and macdonald": "hookemacdonald.ie",
  hooke: "hookemacdonald.ie",
  lisney: "lisney.ie",
  "owen reilly": "owenreilly.com",
};

const getDomain = (name: string): string => {
  const lower = name.trim().toLowerCase();
  const firstWord = lower.split(/\s+/)[0];
  return DOMAIN_OVERRIDES[lower] ?? DOMAIN_OVERRIDES[firstWord] ?? `${firstWord}.com`;
};

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const COLOR_PALETTE = [
  "#ffd6a5", "#b8d4e3", "#e8def8", "#f5c542",
  "#caffbf", "#a0c4ff", "#ffc6ff", "#ffe0b2",
  "#d4f5c0", "#f5d0d0", "#c0d4f5", "#f9c784",
  "#c9b8e8", "#b8e8d4", "#e8c9b8",
];

const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
};

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
}

const CreateSubscriptionModal = ({
  visible,
  onClose,
  onSubmit,
}: CreateSubscriptionModalProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<"Weekly" | "Monthly" | "Yearly">("Monthly");
  const [category, setCategory] = useState<Category>("Entertainment");

  const posthog = usePostHog();
  const parsedPrice = parseFloat(price);
  const isValid = name.trim().length > 0 && !isNaN(parsedPrice) && parsedPrice > 0;

  const handleClose = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
    onClose();
  };

  const handleSubmit = () => {
    if (!isValid) return;
    const startDate = dayjs().toISOString();
    const renewalDate = (
      frequency === "Weekly"
        ? dayjs().add(1, "week")
        : frequency === "Monthly"
        ? dayjs().add(1, "month")
        : dayjs().add(1, "year")
    ).toISOString();

    const domain = getDomain(name);
    const icon = { uri: `https://logos-api.apistemic.com/domain:${domain}` };

    const payload = {
      id: `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      icon,
      name: name.trim(),
      price: parsedPrice,
      currency: "EUR",
      billing: frequency,
      frequency,
      category,
      status: "active",
      startDate,
      renewalDate,
      color: getColorFromName(name.trim()),
    };

    onSubmit(payload);
    posthog.capture("subscription_created", {
      name: payload.name,
      price: payload.price,
      frequency: payload.frequency,
      category: payload.category,
    });

    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
  };

  const sheet = (
    <>
      <Pressable style={{ flex: 1 }} onPress={handleClose} />
      <View className="modal-container">
        <View className="modal-header">
          <Text className="modal-title">New Subscription</Text>
          <Pressable className="modal-close" onPress={handleClose}>
            <Text className="modal-close-text">✕</Text>
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="modal-body">
            <View className="auth-field">
              <Text className="auth-label">Name</Text>
              <TextInput
                className="auth-input"
                placeholder="e.g. Netflix"
                placeholderTextColor="rgba(0,0,0,0.4)"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            <View className="auth-field">
              <Text className="auth-label">Price</Text>
              <TextInput
                className="auth-input"
                placeholder="0.00"
                placeholderTextColor="rgba(0,0,0,0.4)"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            <View className="auth-field">
              <Text className="auth-label">Frequency</Text>
              <View className="picker-row">
                {(["Weekly", "Monthly", "Yearly"] as const).map((opt) => (
                  <Pressable
                    key={opt}
                    className={clsx("picker-option", frequency === opt && "picker-option-active")}
                    onPress={() => setFrequency(opt)}
                  >
                    <Text
                      className={clsx(
                        "picker-option-text",
                        frequency === opt && "picker-option-text-active"
                      )}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="auth-field">
              <Text className="auth-label">Category</Text>
              <View className="category-scroll">
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    className={clsx("category-chip", category === cat && "category-chip-active")}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      className={clsx(
                        "category-chip-text",
                        category === cat && "category-chip-text-active"
                      )}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              className={clsx("auth-button", !isValid && "auth-button-disabled")}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text className="auth-button-text">Add Subscription</Text>
            </Pressable>

            <View className="h-5" />
          </View>
        </ScrollView>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          behavior="padding"
        >
          {sheet}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          {sheet}
        </View>
      )}
    </Modal>
  );
};

export default CreateSubscriptionModal;
