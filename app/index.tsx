import { Link, Redirect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CATEGORIES, type Character } from "../src/characters";
import { Avatar } from "../src/components/Avatar";
import { useStore } from "../src/store";

export default function Discovery() {
  const router = useRouter();
  const all = useStore((s) => s.allCharacters());
  const showMature = useStore((s) => s.settings.showMature);
  const favorites = useStore((s) => s.favorites);
  const hydrated = useStore((s) => s.hydrated);
  const onboarded = useStore((s) => s.settings.onboarded);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      if (c.mature && !showMature) return false;
      if (category && !c.categories.includes(category)) return false;
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.tagline.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [all, query, category, showMature]);

  const favChars = all.filter((c) => favorites.includes(c.id));

  if (hydrated && !onboarded) return <Redirect href="/onboarding" />;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={visible}
      numColumns={2}
      keyExtractor={(c) => c.id}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={
        <View>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.search}
              placeholder="Search characters…"
              placeholderTextColor="#6b6b78"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <Chip
              label="All"
              active={category === null}
              onPress={() => setCategory(null)}
            />
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={c}
                active={category === c}
                onPress={() => setCategory(category === c ? null : c)}
              />
            ))}
          </ScrollView>

          {favChars.length > 0 && !query && !category ? (
            <View style={styles.favSection}>
              <Text style={styles.sectionTitle}>Favorites</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favRow}
              >
                {favChars.map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.favItem}
                    onPress={() => router.push(`/character/${c.id}`)}
                  >
                    <Avatar character={c} size={56} />
                    <Text style={styles.favName} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>
            {category ?? (query ? "Results" : "Explore")}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No characters match that.</Text>
      }
      renderItem={({ item }) => <Card character={item} />}
    />
  );
}

function Card({ character }: { character: Character }) {
  const isFav = useStore((s) => s.favorites.includes(character.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  return (
    <Link href={`/character/${character.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cardTop}>
          <Avatar character={character} size={48} />
          <Pressable
            hitSlop={10}
            onPress={() => toggleFavorite(character.id)}
          >
            <Text style={styles.heart}>{isFav ? "♥" : "♡"}</Text>
          </Pressable>
        </View>
        <Text style={styles.name}>{character.name}</Text>
        <Text style={styles.tagline} numberOfLines={3}>
          {character.tagline}
        </Text>
        {!character.builtin ? (
          <Text style={styles.badge}>yours</Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  row: { gap: 12 },
  searchWrap: { marginBottom: 10 },
  search: {
    backgroundColor: "#17171f",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: "#fff",
    fontSize: 15,
  },
  chips: { gap: 8, paddingBottom: 6 },
  chip: {
    backgroundColor: "#17171f",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#6d4aff" },
  chipText: { color: "#cfcfe0", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  favSection: { marginTop: 8 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  favRow: { gap: 14, paddingBottom: 4 },
  favItem: { alignItems: "center", width: 64 },
  favName: { color: "#9a9aa8", fontSize: 11, marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: "#17171f",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    minHeight: 160,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  heart: { color: "#ff6b9d", fontSize: 22 },
  name: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  tagline: { color: "#9a9aa8", fontSize: 13, lineHeight: 18 },
  badge: {
    color: "#6d4aff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase",
  },
  empty: { color: "#6b6b78", textAlign: "center", marginTop: 40 },
});
