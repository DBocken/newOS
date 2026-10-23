import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { CHARACTERS } from "../src/characters";

export default function CharacterGrid() {
  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={CHARACTERS}
      numColumns={2}
      keyExtractor={(c) => c.id}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <Link href={`/chat/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.tagline} numberOfLines={3}>
              {item.tagline}
            </Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  row: { gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "#17171f",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    minHeight: 150,
  },
  emoji: { fontSize: 40, marginBottom: 8 },
  name: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  tagline: { color: "#9a9aa8", fontSize: 13, lineHeight: 18 },
});
