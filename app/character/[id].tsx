import { fetch as expoFetch } from "expo/fetch";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { useStore } from "../../src/store";

export default function CharacterProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const character = useStore((s) => s.getCharacter(id));
  const isFav = useStore((s) => s.favorites.includes(id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const conversations = useStore((s) => s.conversationsFor(id));
  const createConversation = useStore((s) => s.createConversation);
  const deleteConversation = useStore((s) => s.deleteConversation);
  const deleteCharacter = useStore((s) => s.deleteCharacter);
  const storedMemory = useStore((s) => s.memories[id] ?? "");
  const setMemory = useStore((s) => s.setMemory);
  const [memoryDraft, setMemoryDraft] = useState(storedMemory);

  if (!character) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Character not found.</Text>
      </View>
    );
  }

  const startNew = () => {
    const convo = createConversation(id);
    router.push(`/chat/${convo.id}`);
  };

  const publish = async () => {
    try {
      const res = await expoFetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Publish failed.");
      Alert.alert("Published", `${character!.name} is now in the community gallery.`);
    } catch (e: any) {
      Alert.alert("Not published", e?.message ?? "Publish failed.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () =>
            !character.builtin ? (
              <Pressable
                hitSlop={10}
                onPress={() => router.push(`/create?id=${id}`)}
              >
                <Text style={styles.editBtn}>Edit</Text>
              </Pressable>
            ) : null,
        }}
      />

      <View style={styles.header}>
        <Avatar character={character} size={96} />
        <Text style={styles.name}>{character.name}</Text>
        <Text style={styles.tagline}>{character.tagline}</Text>
        <View style={styles.tags}>
          {character.categories.map((c) => (
            <Text key={c} style={styles.tag}>
              {c}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={startNew}>
          <Text style={styles.primaryText}>Start new chat</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => toggleFavorite(id)}
        >
          <Text style={styles.secondaryText}>{isFav ? "♥" : "♡"}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memory</Text>
        <Text style={styles.memoryHint}>
          Facts {character.name} will remember across chats.
        </Text>
        <TextInput
          style={styles.memoryInput}
          value={memoryDraft}
          onChangeText={setMemoryDraft}
          onEndEditing={() => setMemory(id, memoryDraft.trim())}
          placeholder="e.g. My name is Alex. I love hiking and sci-fi."
          placeholderTextColor="#6b6b78"
          multiline
        />
      </View>

      {conversations.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your chats</Text>
          {conversations.map((c) => (
            <Pressable
              key={c.id}
              style={styles.convo}
              onPress={() => router.push(`/chat/${c.id}`)}
              onLongPress={() =>
                Alert.alert("Delete chat?", c.title, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteConversation(c.id),
                  },
                ])
              }
            >
              <Text style={styles.convoTitle} numberOfLines={1}>
                {c.title}
              </Text>
              <Text style={styles.convoMeta}>
                {new Date(c.updatedAt).toLocaleDateString()} ·{" "}
                {c.messages.length} msgs
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!character.builtin ? (
        <Pressable style={styles.publish} onPress={publish}>
          <Text style={styles.publishText}>🌐 Publish to community gallery</Text>
        </Pressable>
      ) : null}

      {!character.builtin ? (
        <Pressable
          style={styles.delete}
          onPress={() =>
            Alert.alert("Delete character?", `"${character.name}" and its chats.`, [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  deleteCharacter(id);
                  router.back();
                },
              },
            ])
          }
        >
          <Text style={styles.deleteText}>Delete character</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#9a9aa8" },
  editBtn: { color: "#6d4aff", fontSize: 16, fontWeight: "600" },
  header: { alignItems: "center", marginBottom: 24 },
  name: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 14 },
  tagline: {
    color: "#9a9aa8",
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 21,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: {
    color: "#cfcfe0",
    fontSize: 12,
    backgroundColor: "#1d1d26",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actions: { flexDirection: "row", gap: 10, marginBottom: 8 },
  primary: {
    flex: 1,
    backgroundColor: "#6d4aff",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondary: {
    width: 56,
    backgroundColor: "#1d1d26",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: "#ff6b9d", fontSize: 24 },
  section: { marginTop: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  convo: {
    backgroundColor: "#17171f",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  convoTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  convoMeta: { color: "#6b6b78", fontSize: 12, marginTop: 4 },
  memoryHint: { color: "#9a9aa8", fontSize: 13, marginBottom: 8 },
  memoryInput: {
    backgroundColor: "#17171f",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  publish: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#17171f",
    borderRadius: 14,
  },
  publishText: { color: "#c3b5ff", fontSize: 15, fontWeight: "600" },
  delete: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteText: { color: "#ff6b6b", fontSize: 15, fontWeight: "600" },
});
