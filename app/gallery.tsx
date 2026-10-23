import { fetch as expoFetch } from "expo/fetch";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Character } from "../src/characters";
import { Avatar } from "../src/components/Avatar";
import { useStore } from "../src/store";

type Item = Character & { publishedAt: number };

export default function Gallery() {
  const router = useRouter();
  const upsert = useStore((s) => s.upsertCharacter);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await expoFetch("/api/gallery");
        const json = await res.json();
        setItems(json.items ?? []);
      } catch {
        setError("Couldn't reach the gallery.");
      }
    })();
  }, []);

  const importItem = (item: Item) => {
    upsert({
      id: `g-${item.id}`,
      name: item.name,
      emoji: item.emoji,
      avatarUrl: item.avatarUrl,
      tagline: item.tagline,
      greeting: item.greeting,
      systemPrompt: item.systemPrompt,
      categories: item.categories ?? [],
      builtin: false,
    });
    Alert.alert("Added", `${item.name} is now in your library.`, [
      { text: "OK", onPress: () => router.replace("/") },
    ]);
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }
  if (!items) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6d4aff" />
      </View>
    );
  }
  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No shared characters yet. Be the first!</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar character={item} size={48} />
          <View style={styles.meta}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.tagline} numberOfLines={2}>
              {item.tagline}
            </Text>
          </View>
          <Pressable style={styles.add} onPress={() => importItem(item)}>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: "#9a9aa8", textAlign: "center" },
  list: { padding: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#17171f",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  meta: { flex: 1 },
  name: { color: "#fff", fontSize: 15, fontWeight: "700" },
  tagline: { color: "#9a9aa8", fontSize: 12, marginTop: 2 },
  add: {
    backgroundColor: "#6d4aff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  addText: { color: "#fff", fontWeight: "700" },
});
