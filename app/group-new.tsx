import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../src/components/Avatar";
import { useStore } from "../src/store";

export default function NewGroup() {
  const router = useRouter();
  const all = useStore((s) => s.allCharacters());
  const createGroup = useStore((s) => s.createGroup);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const create = () => {
    if (selected.length < 2) return;
    const convo = createGroup(selected);
    router.replace(`/group/${convo.id}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: "New group",
          headerRight: () => (
            <Pressable hitSlop={10} onPress={create} disabled={selected.length < 2}>
              <Text
                style={[styles.create, selected.length < 2 && styles.disabled]}
              >
                Create
              </Text>
            </Pressable>
          ),
        }}
      />
      <Text style={styles.hint}>Pick 2 or more characters for the room.</Text>
      {all.map((c) => {
        const on = selected.includes(c.id);
        return (
          <Pressable
            key={c.id}
            style={[styles.row, on && styles.rowOn]}
            onPress={() => toggle(c.id)}
          >
            <Avatar character={c} size={44} />
            <View style={styles.meta}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.tagline} numberOfLines={1}>
                {c.tagline}
              </Text>
            </View>
            <Text style={styles.box}>{on ? "☑" : "☐"}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  create: { color: "#6d4aff", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.4 },
  hint: { color: "#9a9aa8", fontSize: 14, marginBottom: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#17171f",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rowOn: { borderColor: "#6d4aff" },
  meta: { flex: 1 },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  tagline: { color: "#9a9aa8", fontSize: 12, marginTop: 2 },
  box: { color: "#6d4aff", fontSize: 22 },
});
