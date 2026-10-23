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
import { getCharacter } from "../../src/characters";
import { useChat } from "../../src/useChat";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const character = getCharacter(id);
  const insets = useSafeAreaInsets();

  if (!character) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Character not found.</Text>
      </View>
    );
  }

  const { messages, send, isStreaming, error } = useChat(character);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <Stack.Screen options={{ title: `${character.emoji}  ${character.name}` }} />

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
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
            >
              <Text style={styles.bubbleText}>
                {item.content || (isStreaming ? "…" : "")}
              </Text>
            </View>
          );
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message ${character.name}…`}
          placeholderTextColor="#6b6b78"
          multiline
        />
        <Pressable
          style={[styles.sendBtn, isStreaming && styles.sendBtnDisabled]}
          disabled={isStreaming}
          onPress={() => {
            send(draft);
            setDraft("");
          }}
        >
          <Text style={styles.sendText}>{isStreaming ? "…" : "Send"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#9a9aa8" },
  messages: { padding: 12, gap: 8 },
  bubble: { maxWidth: "82%", borderRadius: 16, padding: 12 },
  mine: { alignSelf: "flex-end", backgroundColor: "#6d4aff" },
  theirs: { alignSelf: "flex-start", backgroundColor: "#1d1d26" },
  bubbleText: { color: "#fff", fontSize: 15, lineHeight: 21 },
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
