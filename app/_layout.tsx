import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
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
              <View style={{ flexDirection: "row", gap: 18 }}>
                <Link href="/create" asChild>
                  <Pressable hitSlop={10}>
                    <Text style={{ color: "#6d4aff", fontSize: 26, fontWeight: "600" }}>
                      ＋
                    </Text>
                  </Pressable>
                </Link>
                <Link href="/settings" asChild>
                  <Pressable hitSlop={10}>
                    <Text style={{ fontSize: 20 }}>⚙️</Text>
                  </Pressable>
                </Link>
              </View>
            ),
          }}
        />
        <Stack.Screen name="character/[id]" options={{ title: "" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "" }} />
        <Stack.Screen
          name="create"
          options={{ title: "New character", presentation: "modal" }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
