import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageContent } from "../../src/components/MessageContent";
import { useStore } from "../../src/store";
import { useGroupChat } from "../../src/useGroupChat";

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const convo = useStore((s) => s.conversations[id]);
  const getCharacter = useStore((s) => s.getCharacter);

  if (!convo || !convo.memberIds) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Group not found.</Text>
      </View>
    );
  }

  const members = convo.memberIds
    .map((mid) => getCharacter(mid))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const { messages, send, busy, error } = useGroupChat(id, members);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const t = setTimeout(
      () => listRef.current?.scrollToEnd({ animated: true }),
      50
    );
    return () => clearTimeout(t);
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <Stack.Screen options={{ title: convo.title }} />

      <FlatList
        ref={listRef}
        style={styles.flex}
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => {
          const mine = item.role === "user";
          return (
            <View
              style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}
            >
              {!mine && item.name ? (
                <Text style={styles.speaker}>{item.name}</Text>
              ) : null}
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <MessageContent content={item.content} />
              </View>
            </View>
          );
        }}
      />

      {busy ? <Text style={styles.typing}>characters are replying…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message the group…"
          placeholderTextColor="#6b6b78"
          multiline
        />
        <Pressable
          style={[styles.sendBtn, busy && styles.sendBtnDisabled]}
          disabled={busy}
          onPress={() => {
            const t = draft;
            setDraft("");
            send(t);
          }}
        >
          <Text style={styles.sendText}>{busy ? "…" : "Send"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#9a9aa8" },
  messages: { padding: 12, gap: 10 },
  row: { maxWidth: "85%" },
  rowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowTheirs: { alignSelf: "flex-start" },
  speaker: { color: "#9a9aa8", fontSize: 12, marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 16, padding: 12 },
  mine: { backgroundColor: "#6d4aff" },
  theirs: { backgroundColor: "#1d1d26" },
  typing: { color: "#9a9aa8", fontStyle: "italic", paddingHorizontal: 14, paddingBottom: 6 },
  error: { color: "#ff6b6b", paddingHorizontal: 14, paddingBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#262630",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "#17171f",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: "#6d4aff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#fff", fontWeight: "700" },
});
