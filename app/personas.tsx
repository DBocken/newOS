import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { uid, useStore } from "../src/store";

export default function Personas() {
  const personas = useStore((s) => s.personas);
  const activeId = useStore((s) => s.activePersonaId);
  const upsert = useStore((s) => s.upsertPersona);
  const remove = useStore((s) => s.deletePersona);
  const setActive = useStore((s) => s.setActivePersona);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const add = () => {
    if (!name.trim()) return;
    upsert({ id: uid(), name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hint}>
        A persona is how you present yourself to characters. The active one is
        added to every chat so characters address you consistently.
      </Text>

      <Pressable
        style={[styles.persona, !activeId && styles.personaActive]}
        onPress={() => setActive(null)}
      >
        <Text style={styles.personaName}>No persona</Text>
        {!activeId ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>

      {personas.map((p) => (
        <Pressable
          key={p.id}
          style={[styles.persona, activeId === p.id && styles.personaActive]}
          onPress={() => setActive(p.id)}
          onLongPress={() => remove(p.id)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.personaName}>{p.name}</Text>
            {p.description ? (
              <Text style={styles.personaDesc} numberOfLines={2}>
                {p.description}
              </Text>
            ) : null}
          </View>
          {activeId === p.id ? <Text style={styles.check}>✓</Text> : null}
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Add a persona</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name (e.g. Alex)"
        placeholderTextColor="#6b6b78"
      />
      <TextInput
        style={[styles.input, styles.area]}
        value={description}
        onChangeText={setDescription}
        placeholder="About you: interests, tone, anything characters should know."
        placeholderTextColor="#6b6b78"
        multiline
      />
      <Pressable style={styles.addBtn} onPress={add}>
        <Text style={styles.addText}>Add persona</Text>
      </Pressable>
      <Text style={styles.footnote}>Long-press a persona to delete it.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  hint: { color: "#9a9aa8", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  persona: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17171f",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  personaActive: { borderColor: "#6d4aff" },
  personaName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  personaDesc: { color: "#9a9aa8", fontSize: 13, marginTop: 3 },
  check: { color: "#6d4aff", fontSize: 18, fontWeight: "700", marginLeft: 10 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#17171f",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#fff",
    fontSize: 15,
    marginBottom: 10,
  },
  area: { minHeight: 80, textAlignVertical: "top" },
  addBtn: {
    backgroundColor: "#6d4aff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  footnote: { color: "#6b6b78", fontSize: 12, marginTop: 12, textAlign: "center" },
});
