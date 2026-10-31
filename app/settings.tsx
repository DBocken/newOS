import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Character } from "../src/characters";
import { disableDailyReminder, enableDailyReminder } from "../src/notifications";
import { getSecret, setSecret } from "../src/secrets";
import { uid, useStore } from "../src/store";
import { normalizeSyncKey } from "../src/syncCrypto";

const MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"];
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
  const router = useRouter();
  const activePersona = useStore((s) => s.activePersona());
  const syncEnabled = useStore((s) => s.syncEnabled);
  const setSyncEnabled = useStore((s) => s.setSyncEnabled);
  const [accessCode, setAccessCode] = useState("");
  const [hasAccessCode, setHasAccessCode] = useState(false);
  const [syncKeyInput, setSyncKeyInput] = useState("");

  useEffect(() => {
    getSecret("accessCode").then((code) => setHasAccessCode(!!code));
  }, []);

  const saveAccessCode = async () => {
    const code = accessCode.trim();
    if (!code) return;
    await setSecret("accessCode", code);
    setAccessCode("");
    setHasAccessCode(true);
    Alert.alert("Saved", "This device can now use the server.");
  };

  const removeAccessCode = async () => {
    await setSecret("accessCode", null);
    setHasAccessCode(false);
  };

  const turnOnSync = async () => {
    const bytes = await Crypto.getRandomBytesAsync(32);
    const key = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    await setSecret("syncKey", key);
    setSyncEnabled(true);
    Alert.alert(
      "Sync is on",
      "Your data is encrypted on this device before upload. Copy your sync key to use it on another device. Without it, the data can't be recovered."
    );
  };

  const connectSync = async () => {
    const key = normalizeSyncKey(syncKeyInput);
    if (!key) {
      Alert.alert("Invalid key", "A sync key has 64 characters, 0-9 and a-f.");
      return;
    }
    await setSecret("syncKey", key);
    setSyncKeyInput("");
    setSyncEnabled(true);
  };

  const copySyncKey = async () => {
    const key = await getSecret("syncKey");
    if (!key) return;
    await Clipboard.setStringAsync(key);
    Alert.alert("Copied", "Keep this key private. Anyone with it can read your synced chats.");
  };

  const turnOffSync = async () => {
    await setSecret("syncKey", null);
    setSyncEnabled(false);
  };

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
        if (typeof c?.name !== "string" || typeof c?.systemPrompt !== "string") continue;
        // A fresh id means pasted text can't replace an existing character,
        // and remote avatars are dropped because loading one reveals the
        // device's IP address to whoever hosts it.
        upsert({
          id: uid(),
          name: c.name,
          emoji: typeof c.emoji === "string" ? c.emoji : "🤖",
          avatarUrl: c.avatarUrl?.startsWith?.("data:image/") ? c.avatarUrl : undefined,
          tagline: typeof c.tagline === "string" ? c.tagline : "A custom character.",
          greeting: typeof c.greeting === "string" ? c.greeting : "Hi there!",
          systemPrompt: c.systemPrompt,
          categories: Array.isArray(c.categories) ? c.categories.filter((x) => typeof x === "string") : [],
          mature: Boolean(c.mature),
          builtin: false,
        });
        n++;
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
      <Section title="You">
        <Action
          label={`Personas${activePersona ? ` · ${activePersona.name}` : ""}`}
          onPress={() => router.push("/personas")}
        />
        <Action label="Insights" onPress={() => router.push("/stats")} />
        <Action label="Upgrade plan" onPress={() => router.push("/paywall")} />
      </Section>

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

      <Section title="Notifications">
        <Toggle
          label="Daily check-in reminder"
          value={settings.dailyReminder}
          onPress={async () => {
            if (settings.dailyReminder) {
              await disableDailyReminder();
              update({ dailyReminder: false });
            } else {
              const ok = await enableDailyReminder();
              if (ok) update({ dailyReminder: true });
              else
                Alert.alert(
                  "Permission needed",
                  "Enable notifications for this app to get reminders."
                );
            }
          }}
        />
      </Section>

      <Section title="Your characters">
        <Action label="Export to clipboard" onPress={exportChars} />
        <Action label="Import from clipboard" onPress={importChars} />
      </Section>

      <Section title="Server access">
        {hasAccessCode ? (
          <>
            <Row label="Access code saved" selected onPress={() => {}} />
            <Action label="Remove access code" onPress={removeAccessCode} />
          </>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={accessCode}
              onChangeText={setAccessCode}
              placeholder="Access code"
              placeholderTextColor="#6b6b78"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Pressable style={styles.saveBtn} onPress={saveAccessCode}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        )}
      </Section>

      <Section title="Encrypted sync">
        {syncEnabled ? (
          <>
            <Row label="Sync is on" selected onPress={() => {}} />
            <Action label="Copy sync key" onPress={copySyncKey} />
            <Action label="Turn off sync on this device" onPress={turnOffSync} />
          </>
        ) : (
          <>
            <Action label="Turn on sync" onPress={turnOnSync} />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={syncKeyInput}
                onChangeText={setSyncKeyInput}
                placeholder="Key from another device"
                placeholderTextColor="#6b6b78"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <Pressable style={styles.saveBtn} onPress={connectSync}>
                <Text style={styles.saveText}>Connect</Text>
              </Pressable>
            </View>
          </>
        )}
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
  inputRow: { flexDirection: "row", gap: 8, padding: 10 },
  input: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: "#fff",
  },
  saveBtn: {
    backgroundColor: "#6d4aff",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  footer: { color: "#4b4b58", textAlign: "center", marginTop: 10 },
});
