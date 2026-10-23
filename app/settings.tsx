import * as Clipboard from "expo-clipboard";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Character } from "../src/characters";
import { useStore } from "../src/store";

const MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o1-mini"];
const TEMPS = [
  { label: "Precise", value: 0.3 },
  { label: "Balanced", value: 0.8 },
  { label: "Creative", value: 1.2 },
];

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const userCharacters = useStore((s) => s.userCharacters);
  const upsert = useStore((s) => s.upsertCharacter);
  const clearAllData = useStore((s) => s.clearAllData);

  const exportChars = async () => {
    if (!userCharacters.length) {
      Alert.alert("Nothing to export", "You haven't created any characters.");
      return;
    }
    await Clipboard.setStringAsync(JSON.stringify(userCharacters, null, 2));
    Alert.alert("Copied", `${userCharacters.length} character(s) copied as JSON.`);
  };

  const importChars = async () => {
    const text = await Clipboard.getStringAsync();
    try {
      const parsed = JSON.parse(text);
      const arr: Character[] = Array.isArray(parsed) ? parsed : [parsed];
      let n = 0;
      for (const c of arr) {
        if (c && c.name && c.systemPrompt) {
          upsert({ ...c, builtin: false });
          n++;
        }
      }
      Alert.alert(
        n ? "Imported" : "Nothing imported",
        n ? `${n} character(s) added from clipboard.` : "No valid characters found."
      );
    } catch {
      Alert.alert("Import failed", "Clipboard doesn't contain valid character JSON.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Model">
        {MODELS.map((m) => (
          <Row
            key={m}
            label={m}
            selected={settings.model === m}
            onPress={() => update({ model: m })}
          />
        ))}
      </Section>

      <Section title="Response style">
        {TEMPS.map((t) => (
          <Row
            key={t.value}
            label={`${t.label} (${t.value})`}
            selected={settings.temperature === t.value}
            onPress={() => update({ temperature: t.value })}
          />
        ))}
      </Section>

      <Section title="Content">
        <Toggle
          label="Show mature characters"
          value={settings.showMature}
          onPress={() => update({ showMature: !settings.showMature })}
        />
      </Section>

      <Section title="Voice">
        <Toggle
          label="Read replies aloud"
          value={settings.autoSpeak}
          onPress={() => update({ autoSpeak: !settings.autoSpeak })}
        />
      </Section>

      <Section title="Your characters">
        <Action label="Export to clipboard" onPress={exportChars} />
        <Action label="Import from clipboard" onPress={importChars} />
      </Section>

      <Section title="Data">
        <Action
          label="Clear all data"
          destructive
          onPress={() =>
            Alert.alert(
              "Clear all data?",
              "Deletes your characters, chats, and favorites. This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear",
                  style: "destructive",
                  onPress: clearAllData,
                },
              ]
            )
          }
        />
      </Section>

      <Text style={styles.footer}>newOS Chat · prototype</Text>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

function Action({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, destructive && styles.destructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Toggle({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: "#9a9aa8",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { backgroundColor: "#17171f", borderRadius: 14, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#23232d",
  },
  rowLabel: { color: "#fff", fontSize: 15 },
  destructive: { color: "#ff6b6b" },
  check: { color: "#6d4aff", fontSize: 18, fontWeight: "700" },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2c2c38",
    padding: 3,
  },
  switchOn: { backgroundColor: "#6d4aff" },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  knobOn: { alignSelf: "flex-end" },
  footer: { color: "#4b4b58", textAlign: "center", marginTop: 10 },
});
