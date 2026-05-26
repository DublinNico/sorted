import { colors, overlay } from "@/constants/theme";
import { CardType, detectCardType, formatExpiry } from "@/utils/cardUtils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentCard {
  id: string;
  type: CardType;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

// ─── Add Card Modal ───────────────────────────────────────────────────────────

function AddCardModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (card: Omit<PaymentCard, "id" | "isDefault">) => void;
}) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");

  const last4 = number.replace(/\D/g, "").slice(-4);
  const canSubmit = number.replace(/\D/g, "").length >= 13 && expiry.length === 5;

  const handleAdd = () => {
    onAdd({ type: detectCardType(number), last4, expiry });
    setNumber("");
    setExpiry("");
    onClose();
  };

  const handleClose = () => {
    setNumber("");
    setExpiry("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={{ flex: 1, backgroundColor: overlay }} onPress={handleClose}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 40,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 20, color: colors.primary, fontFamily: "sans-bold" }}>
              Add New Card
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 14, color: colors.primary, fontFamily: "sans-semibold" }}>Card Number</Text>
            <TextInput
              value={number}
              onChangeText={(v) => setNumber(v.replace(/\D/g, "").slice(0, 16))}
              placeholder="•••• •••• •••• ••••"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              style={{
                backgroundColor: colors.background,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontFamily: "sans-medium",
                color: colors.primary,
                letterSpacing: 2,
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 14, color: colors.primary, fontFamily: "sans-semibold" }}>Expiry Date</Text>
            <TextInput
              value={expiry}
              onChangeText={(v) => setExpiry(formatExpiry(v))}
              placeholder="MM/YY"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={5}
              style={{
                backgroundColor: colors.background,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontFamily: "sans-medium",
                color: colors.primary,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            disabled={!canSubmit}
            activeOpacity={0.8}
            style={{
              backgroundColor: canSubmit ? colors.accent : colors.accent + "70",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 16, color: colors.background, fontFamily: "sans-bold" }}>
              Add Card
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Card row ─────────────────────────────────────────────────────────────────

function CardRow({
  card,
  onSetDefault,
  onRemove,
}: {
  card: PaymentCard;
  onSetDefault: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.accent,
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        {/* Left: icon + name + last4 */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="card-outline" size={22} color={colors.accent} />
          </View>
          <View>
            <Text style={{ fontSize: 17, color: colors.background, fontFamily: "sans-bold" }}>
              {card.type}
            </Text>
            <Text style={{ fontSize: 13, color: colors.background + "CC", fontFamily: "sans-regular", letterSpacing: 1 }}>
              •••• {card.last4}
            </Text>
          </View>
        </View>

        {/* Default badge */}
        {card.isDefault && (
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.accent, fontFamily: "sans-semibold" }}>
              Default
            </Text>
          </View>
        )}
      </View>

      {/* Expiry + actions */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <View>
          <Text style={{ fontSize: 11, color: colors.background + "99", fontFamily: "sans-regular" }}>
            Expires
          </Text>
          <Text style={{ fontSize: 14, color: colors.background, fontFamily: "sans-semibold" }}>
            {card.expiry}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {!card.isDefault && (
            <TouchableOpacity
              onPress={onSetDefault}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.background,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 7,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "sans-semibold" }}>
                Set Default
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRemove} hitSlop={8} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: colors.destructive, fontFamily: "sans-semibold" }}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (card: Omit<PaymentCard, "id" | "isDefault">) => {
    setCards((prev) => [
      ...prev,
      { ...card, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, isDefault: prev.length === 0 },
    ]);
  };

  const handleSetDefault = (id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const handleRemove = (id: string) => {
    Alert.alert("Remove Card", "Are you sure you want to remove this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          setCards((prev) => {
            const remaining = prev.filter((c) => c.id !== id);
            if (remaining.length > 0 && !remaining.some((c) => c.isDefault)) {
              return remaining.map((c, i) => i === 0 ? { ...c, isDefault: true } : c);
            }
            return remaining;
          }),
      },
    ]);
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
          Payment Methods
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
      >
        <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "sans-regular", marginBottom: 20 }}>
          Manage your saved payment methods for automatic billing
        </Text>

        {/* Card list */}
        {cards.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            onSetDefault={() => handleSetDefault(card.id)}
            onRemove={() => handleRemove(card.id)}
          />
        ))}

        {/* Add new card */}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderStyle: "dashed",
            paddingVertical: 32,
            alignItems: "center",
            gap: 10,
            marginTop: cards.length > 0 ? 4 : 0,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={24} color={colors.mutedForeground} />
          </View>
          <Text style={{ fontSize: 16, color: colors.primary, fontFamily: "sans-semibold" }}>
            Add New Card
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "sans-regular" }}>
            Add a payment method
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AddCardModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
    </SafeAreaView>
  );
}
