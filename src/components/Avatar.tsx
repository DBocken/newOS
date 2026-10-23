import { Image } from "react-native";
import { Text, View } from "react-native";
import type { Character } from "../characters";

export function Avatar({
  character,
  size = 48,
}: {
  character: Pick<Character, "emoji" | "avatarUrl">;
  size?: number;
}) {
  if (character.avatarUrl) {
    return (
      <Image
        source={{ uri: character.avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#262633",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.55 }}>{character.emoji}</Text>
    </View>
  );
}
