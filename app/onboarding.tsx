import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../src/store";

const STEPS = [
  { emoji: "💬", title: "Chat with characters", body: "Pick a character and start talking. Each one has its own personality." },
  { emoji: "✨", title: "Create your own", body: "Tap ＋ to build a character from a name and a personality prompt." },
  { emoji: "🔒", title: "Your chats stay on device", body: "Conversations are stored locally. Bring your own OpenAI key on the server." },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const update = useStore((s) => s.updateSettings);

  const finish = () => {
    update({ onboarded: true });
    router.replace("/");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.brand}>newOS Chat</Text>
      <View style={styles.steps}>
        {STEPS.map((s) => (
          <View key={s.title} style={styles.step}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <View style={styles.stepText}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <Pressable style={styles.cta} onPress={finish}>
        <Text style={styles.ctaText}>Get started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  brand: { color: "#fff", fontSize: 32, fontWeight: "800", textAlign: "center" },
  steps: { gap: 28 },
  step: { flexDirection: "row", gap: 16, alignItems: "center" },
  emoji: { fontSize: 36 },
  stepText: { flex: 1 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  body: { color: "#9a9aa8", fontSize: 14, lineHeight: 20 },
  cta: {
    backgroundColor: "#6d4aff",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
