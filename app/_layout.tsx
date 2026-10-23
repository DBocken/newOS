import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAutoSync } from "../src/useAutoSync";

export default function RootLayout() {
  useAutoSync();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0b0b0f" },
          headerTintColor: "#fff",
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#0b0b0f" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Characters",
            headerRight: () => (
              <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
                <Link href="/search" asChild>
                  <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Search">
                    <Text style={{ fontSize: 18 }}>🔍</Text>
                  </Pressable>
                </Link>
                <Link href="/gallery" asChild>
                  <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Community gallery">
                    <Text style={{ fontSize: 18 }}>🌐</Text>
                  </Pressable>
                </Link>
                <Link href="/group-new" asChild>
                  <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="New group chat">
                    <Text style={{ fontSize: 18 }}>👥</Text>
                  </Pressable>
                </Link>
                <Link href="/create" asChild>
                  <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Create character">
                    <Text style={{ color: "#6d4aff", fontSize: 26, fontWeight: "600" }}>
                      ＋
                    </Text>
                  </Pressable>
                </Link>
                <Link href="/settings" asChild>
                  <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Settings">
                    <Text style={{ fontSize: 20 }}>⚙️</Text>
                  </Pressable>
                </Link>
              </View>
            ),
          }}
        />
        <Stack.Screen name="character/[id]" options={{ title: "" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "" }} />
        <Stack.Screen name="call/[id]" options={{ title: "Call" }} />
        <Stack.Screen name="group/[id]" options={{ title: "" }} />
        <Stack.Screen
          name="group-new"
          options={{ title: "New group", presentation: "modal" }}
        />
        <Stack.Screen
          name="create"
          options={{ title: "New character", presentation: "modal" }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="personas" options={{ title: "Personas" }} />
        <Stack.Screen name="gallery" options={{ title: "Community gallery" }} />
        <Stack.Screen name="stats" options={{ title: "Insights" }} />
        <Stack.Screen name="search" options={{ title: "Search" }} />
        <Stack.Screen
          name="paywall"
          options={{ title: "Upgrade", presentation: "modal" }}
        />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
