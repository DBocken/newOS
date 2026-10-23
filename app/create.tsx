import { fetch as expoFetch } from "expo/fetch";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar } from "../src/components/Avatar";
import { CATEGORIES, type Character } from "../src/characters";
import { useStore, uid } from "../src/store";

const EMOJI_CHOICES = ["🤖", "🧙", "🐉", "👩‍🚀", "🦊", "🧛", "👽", "🧚", "🐺", "💫"];

export default function CreateCharacter() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => (id ? s.getCharacter(id) : undefined));
  const upsert = useStore((s) => s.upsertCharacter);

  const [name, setName] = useState(existing?.name ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "🤖");
  const [avatarUrl, setAvatarUrl] = useState(existing?.avatarUrl ?? "");
  const [tagline, setTagline] = useState(existing?.tagline ?? "");
  const [greeting, setGreeting] = useState(existing?.greeting ?? "");
  const [systemPrompt, setSystemPrompt] = useState(
    existing?.systemPrompt ?? ""
  );
  const [cats, setCats] = useState<string[]>(existing?.categories ?? []);
  const [mature, setMature] = useState(existing?.mature ?? false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateAvatar = async () => {
    const prompt = `${name || "a character"}. ${tagline}`.trim();
    setGenerating(true);
    setError(null);
    try {
      const res = await expoFetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok || !json?.dataUri) {
        throw new Error(json?.error || "Could not generate avatar.");
      }
      setAvatarUrl(json.dataUri);
    } catch (e: any) {
      setError(e?.message ?? "Avatar generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleCat = (c: string) =>
    setCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const save = () => {
    if (!name.trim() || !systemPrompt.trim()) {
      setError("Name and personality are required.");
      return;
    }
    const char: Character = {
      id: existing?.id ?? uid(),
      name: name.trim(),
      emoji,
      avatarUrl: avatarUrl.trim() || undefined,
      tagline: tagline.trim() || "A custom character.",
      greeting: greeting.trim() || "Hi there!",
      systemPrompt: systemPrompt.trim(),
      categories: cats.length ? cats : ["Companion"],
      mature,
      builtin: false,
    };
    upsert(char);
    router.back();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{
          title: existing ? "Edit character" : "New character",
          headerRight: () => (
            <Pressable hitSlop={10} onPress={save}>
              <Text style={styles.save}>Save</Text>
            </Pressable>
          ),
        }}
      />

      <Field label="Name">
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Nova"
          placeholderTextColor="#6b6b78"
        />
      </Field>

      <Field label="Avatar emoji">
        <View style={styles.emojiRow}>
          {EMOJI_CHOICES.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={[styles.emojiBtn, emoji === e && styles.emojiActive]}
            >
              <Text style={styles.emoji}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Avatar image">
        <View style={styles.avatarRow}>
          <Avatar character={{ emoji, avatarUrl: avatarUrl || undefined }} size={64} />
          <Pressable
            style={styles.genBtn}
            onPress={generateAvatar}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.genText}>✨ Generate with AI</Text>
            )}
          </Pressable>
        </View>
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="…or paste an image URL"
          placeholderTextColor="#6b6b78"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Tagline">
        <TextInput
          style={styles.input}
          value={tagline}
          onChangeText={setTagline}
          placeholder="One-line description"
          placeholderTextColor="#6b6b78"
        />
      </Field>

      <Field label="Greeting">
        <TextInput
          style={[styles.input, styles.area]}
          value={greeting}
          onChangeText={setGreeting}
          placeholder="First message the character sends"
          placeholderTextColor="#6b6b78"
          multiline
        />
      </Field>

      <Field label="Personality (system prompt)">
        <TextInput
          style={[styles.input, styles.areaTall]}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          placeholder="You are …. Describe how the character talks and behaves."
          placeholderTextColor="#6b6b78"
          multiline
        />
      </Field>

      <Field label="Categories">
        <View style={styles.emojiRow}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => toggleCat(c)}
              style={[styles.chip, cats.includes(c) && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  cats.includes(c) && styles.chipTextActive,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Pressable style={styles.toggle} onPress={() => setMature(!mature)}>
        <Text style={styles.toggleLabel}>Mature content</Text>
        <View style={[styles.switch, mature && styles.switchOn]}>
          <View style={[styles.knob, mature && styles.knobOn]} />
        </View>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>
          {existing ? "Save changes" : "Create character"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  save: { color: "#6d4aff", fontSize: 16, fontWeight: "700" },
  field: { marginBottom: 16 },
  fieldLabel: {
    color: "#9a9aa8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#17171f",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#fff",
    fontSize: 15,
  },
  area: { minHeight: 64, textAlignVertical: "top" },
  areaTall: { minHeight: 120, textAlignVertical: "top" },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  genBtn: {
    flex: 1,
    backgroundColor: "#2a2140",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#6d4aff",
  },
  genText: { color: "#c3b5ff", fontSize: 14, fontWeight: "600" },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#17171f",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiActive: { borderWidth: 2, borderColor: "#6d4aff" },
  emoji: { fontSize: 22 },
  chip: {
    backgroundColor: "#17171f",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#6d4aff" },
  chipText: { color: "#cfcfe0", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#17171f",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLabel: { color: "#fff", fontSize: 15 },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2c2c38",
    padding: 3,
  },
  switchOn: { backgroundColor: "#6d4aff" },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  knobOn: { alignSelf: "flex-end" },
  error: { color: "#ff6b6b", marginTop: 14 },
  saveBtn: {
    backgroundColor: "#6d4aff",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
