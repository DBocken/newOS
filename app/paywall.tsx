import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Tier } from "../src/subscription";
import { TIERS, useSubscription } from "../src/subscription";

export default function Paywall() {
  const router = useRouter();
  const current = useSubscription((s) => s.tier);
  const setTier = useSubscription((s) => s.setTier);

  const choose = (t: Tier) => {
    setTier(t);
    router.back();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Upgrade your plan</Text>
      <Text style={styles.subtitle}>
        Pick the plan that fits how you chat. Change or cancel anytime.
      </Text>

      {TIERS.map((tier) => {
        const active = tier.id === current;
        return (
          <View
            key={tier.id}
            style={[styles.card, active && styles.cardActive]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{tier.name}</Text>
              <Text style={styles.cardPrice}>{tier.price}</Text>
            </View>

            <View style={styles.perks}>
              {tier.perks.map((perk) => (
                <View key={perk} style={styles.perkRow}>
                  <Text style={styles.perkDot}>✓</Text>
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.chooseBtn, active && styles.chooseBtnActive]}
              onPress={() => choose(tier.id)}
              disabled={active}
            >
              <Text
                style={[
                  styles.chooseText,
                  active && styles.chooseTextActive,
                ]}
              >
                {active ? "Current plan" : "Choose"}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.disclaimer}>
        Demo only — no real billing is connected. Choosing a plan simply
        updates a locally stored flag on this device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0b0f" },
  container: { padding: 16, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: {
    color: "#9a9aa8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#17171f",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardActive: { borderColor: "#6d4aff" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardPrice: { color: "#6d4aff", fontSize: 16, fontWeight: "700" },
  perks: { marginBottom: 16 },
  perkRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  perkDot: {
    color: "#6d4aff",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
    marginTop: 1,
  },
  perkText: { color: "#fff", fontSize: 14, lineHeight: 20, flex: 1 },
  chooseBtn: {
    backgroundColor: "#6d4aff",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  chooseBtnActive: { backgroundColor: "#1d1d26" },
  chooseText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  chooseTextActive: { color: "#9a9aa8" },
  disclaimer: {
    color: "#6b6b78",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
});
