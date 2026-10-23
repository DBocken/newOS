import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Character } from "../src/characters";
import { Avatar } from "../src/components/Avatar";
import type { Conversation } from "../src/store";
import { useStore } from "../src/store";

type TopCharacter = {
  character: Character;
  count: number;
};

export default function Stats() {
  const characters = useStore((s) => s.allCharacters());
  const conversations = useStore((s) => s.conversations);

  const convoList: Conversation[] = Object.values(conversations);

  const totalCharacters = characters.length;
  const yourCharacters = characters.filter((c) => !c.builtin).length;
  const totalConversations = convoList.length;
  const totalMessages = convoList.reduce(
    (sum, c) => sum + c.messages.length,
    0
  );

  // Message count per character across their conversations.
  const countsById = new Map<string, number>();
  for (const convo of convoList) {
    if (!convo.characterId) continue; // skip group chats (no primary character)
    const prev = countsById.get(convo.characterId) ?? 0;
    countsById.set(convo.characterId, prev + convo.messages.length);
  }

  const top: TopCharacter[] = [...countsById.entries()]
    .map(([id, count]) => {
      const character = characters.find((c) => c.id === id);
      return character ? { character, count } : null;
    })
    .filter((x): x is TopCharacter => x !== null && x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        <Tile label="Characters" value={totalCharacters} />
        <Tile label="Your characters" value={yourCharacters} accent />
        <Tile label="Conversations" value={totalConversations} />
        <Tile label="Messages" value={totalMessages} accent />
      </View>

      <Text style={styles.sectionTitle}>Most chatted</Text>
      <View style={styles.card}>
        {top.length === 0 ? (
          <Text style={styles.empty}>
            No conversations yet. Start chatting to see your top characters.
          </Text>
        ) : (
          top.map((entry, i) => (
            <Link
              key={entry.character.id}
              href={`/character/${entry.character.id}`}
              style={styles.rowLink}
            >
              <View style={styles.row}>
                <Text style={styles.rank}>{i + 1}</Text>
                <Avatar character={entry.character} size={44} />
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {entry.character.name}
                  </Text>
                  <Text style={styles.rowTagline} numberOfLines={1}>
                    {entry.character.tagline}
                  </Text>
                </View>
                <Text style={styles.count}>{entry.count}</Text>
              </View>
            </Link>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, accent && styles.tileValueAccent]}>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: "#0b0b0f" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48.5%",
    backgroundColor: "#17171f",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tileValue: { color: "#fff", fontSize: 34, fontWeight: "800" },
  tileValueAccent: { color: "#6d4aff" },
  tileLabel: {
    color: "#9a9aa8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionTitle: {
    color: "#9a9aa8",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },
  card: { backgroundColor: "#17171f", borderRadius: 14, overflow: "hidden" },
  empty: { color: "#9a9aa8", fontSize: 14, padding: 16 },
  rowLink: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#23232d",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rank: {
    color: "#6d4aff",
    fontSize: 16,
    fontWeight: "800",
    width: 22,
  },
  rowText: { flex: 1, marginLeft: 12 },
  rowName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  rowTagline: { color: "#9a9aa8", fontSize: 13, marginTop: 2 },
  count: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    backgroundColor: "#1d1d26",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
});
