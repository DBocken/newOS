import { Image, StyleSheet, Text, View } from "react-native";

// Minimal in-bubble renderer: inline images (image URLs or data URIs) are
// pulled out and shown as pictures; the rest renders with **bold** support.
// Deliberately tiny — no markdown dependency — but covers the common cases
// leading chat apps show (images + emphasis).

const IMAGE_RE =
  /(https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?|data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+)/gi;

function Bold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={styles.text}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <Text key={i} style={styles.boldText}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        )
      )}
    </Text>
  );
}

export function MessageContent({ content }: { content: string }) {
  const images = content.match(IMAGE_RE) ?? [];
  const text = content.replace(IMAGE_RE, "").trim();

  return (
    <View style={styles.wrap}>
      {text ? <Bold text={text} /> : null}
      {images.map((uri, i) => (
        <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  text: { color: "#fff", fontSize: 15, lineHeight: 21 },
  boldText: { fontWeight: "700" },
  image: { width: 220, height: 220, borderRadius: 12 },
});
