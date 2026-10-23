import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Character } from "../src/characters";
import { Avatar } from "../src/components/Avatar";
import { useStore } from "../src/store";

type Result = {
  key: string;
  conversationId: string;
  character: Character | undefined;
  title: string;
  before: string;
  match: string;
  after: string;
};

const MAX_RESULTS = 200;
const SNIPPET_PAD = 40;

function buildSnippet(content: string, index: number, qLen: number) {
  const start = Math.max(0, index - SNIPPET_PAD);
  const end = Math.min(content.length, index + qLen + SNIPPET_PAD);
  return {
    before: (start > 0 ? "…" : "") + content.slice(start, index),
    match: content.slice(index, index + qLen),
    after: content.slice(index + qLen, end) + (end < content.length ? "…" : ""),
  };
}

export default function Search() {
  const router = useRouter();
  const conversations = useStore((s) => s.conversations);
  const getCharacter = useStore((s) => s.getCharacter);
  const [query, setQuery] = useState("");

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: Result[] = [];
    for (const convo of Object.values(conversations)) {
      const character = convo.characterId
        ? getCharacter(convo.characterId)
        : undefined;
      const nameMatches = character
        ? character.name.toLowerCase().includes(q)
        : false;

      let matchedInMessages = false;
      for (let i = 0; i < convo.messages.length; i++) {
        const msg = convo.messages[i];
        if (msg.role === "system") continue;
        const content = msg.content ?? "";
        const idx = content.toLowerCase().indexOf(q);
        if (idx === -1) continue;
        matchedInMessages = true;
        const snippet = buildSnippet(content, idx, q.length);
        out.push({
          key: `${convo.id}:${i}`,
          conversationId: convo.id,
          character,
          title: convo.title,
          ...snippet,
        });
        if (out.length >= MAX_RESULTS) return out;
      }

      // Surface a name-only match (no message hit) so filtering by
      // character name always yields the conversation.
      if (nameMatches && !matchedInMessages) {
        const first = convo.messages.find((m) => m.role !== "system");
        const content = first?.content ?? "";
        out.push({
          key: `${convo.id}:name`,
          conversationId: convo.id,
          character,
          title: convo.title,
          before: "",
          match: "",
          after:
            content.length > SNIPPET_PAD * 2
              ? content.slice(0, SNIPPET_PAD * 2) + "…"
              : content,
        });
        if (out.length >= MAX_RESULTS) return out;
      }
    }
    return out;
  }, [query, conversations, getCharacter]);

  const trimmed = query.trim();

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages and characters"
          placeholderTextColor="#9a9aa8"
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable style={styles.clear} onPress={() => setQuery("")}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {trimmed.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>
            Type to search across all of your conversations.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No matches for “{trimmed}”.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.key}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/chat/${item.conversationId}`)}
            >
              {item.character ? (
                <Avatar character={item.character} size={44} />
              ) : (
                <View style={styles.groupAvatar}>
                  <Text style={styles.groupEmoji}>👥</Text>
                </View>
              )}
              <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.character?.name ?? item.title ?? "Group chat"}
                </Text>
                <Text style={styles.snippet} numberOfLines={2}>
                  {item.before}
                  <Text style={styles.highlight}>{item.match}</Text>
                  {item.after}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0b0f" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  input: {
    flex: 1,
    backgroundColor: "#17171f",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#fff",
    fontSize: 15,
  },
  clear: { paddingHorizontal: 6, paddingVertical: 6 },
  clearText: { color: "#6d4aff", fontWeight: "700", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: "#9a9aa8", textAlign: "center" },
  list: { paddingHorizontal: 14, paddingBottom: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#17171f",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#262633",
    alignItems: "center",
    justifyContent: "center",
  },
  groupEmoji: { fontSize: 22 },
  meta: { flex: 1 },
  name: { color: "#fff", fontSize: 15, fontWeight: "700" },
  snippet: { color: "#9a9aa8", fontSize: 13, marginTop: 3 },
  highlight: { color: "#fff", backgroundColor: "#6d4aff", fontWeight: "700" },
});
