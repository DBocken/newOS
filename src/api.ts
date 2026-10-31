import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";
import { getSecret } from "./secrets";

// Base URL of the deployed API routes, baked in at build time. On web the app
// and API share an origin, but an installed app has no origin of its own, so
// native builds must set EXPO_PUBLIC_API_URL or every API call fails.
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

export function joinApiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

export function apiUrl(path: string): string {
  if (Platform.OS !== "web") {
    if (!API_BASE) {
      throw new Error(
        "No server configured. Build the app with EXPO_PUBLIC_API_URL set."
      );
    }
    if (!API_BASE.startsWith("https://")) {
      throw new Error("The server address must use https.");
    }
  }
  return joinApiUrl(API_BASE, path);
}

type ApiInit = NonNullable<Parameters<typeof expoFetch>[1]>;

// All server calls go through here so the access code is attached in one place.
export async function apiFetch(path: string, init: ApiInit = {}) {
  const url = apiUrl(path);
  const accessCode = await getSecret("accessCode");
  return expoFetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(accessCode ? { Authorization: `Bearer ${accessCode}` } : {}),
    },
  });
}

// Turns a failed response into text that can be shown to the user.
export async function apiError(res: { status: number; text(): Promise<string> }) {
  const detail = await res.text().catch(() => "");
  try {
    const message = JSON.parse(detail)?.error;
    if (typeof message === "string") return message;
  } catch {
    // not JSON; fall through
  }
  return `Request failed (${res.status})`;
}
