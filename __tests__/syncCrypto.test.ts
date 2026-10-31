import {
  decryptBlob,
  deriveSyncKeys,
  encryptBlob,
  NONCE_BYTES,
  normalizeSyncKey,
} from "../src/syncCrypto";
import type { SyncBlob } from "../src/store";

const KEY = "ab".repeat(32);
const nonce = new Uint8Array(NONCE_BYTES).fill(7);
const blob: SyncBlob = {
  userCharacters: [],
  conversations: {},
  favorites: ["luna"],
  memories: { luna: "ein privates Detail ♥" },
};

describe("normalizeSyncKey", () => {
  it("accepts pasted formatting", () => {
    expect(normalizeSyncKey(`AB${"ab".repeat(30)} -ab`)).toBe(KEY);
    expect(normalizeSyncKey(` ${KEY.toUpperCase()} `)).toBe(KEY);
  });

  it("rejects anything that isn't a full key", () => {
    expect(normalizeSyncKey("password123")).toBeNull();
  });
});

describe("deriveSyncKeys", () => {
  it("is stable across devices", () => {
    expect(deriveSyncKeys(KEY).id).toBe(deriveSyncKeys(KEY).id);
  });

  it("never exposes the key or encryption key as the id", () => {
    const { id, encryptionKey } = deriveSyncKeys(KEY);
    const hex = Buffer.from(encryptionKey).toString("hex");
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toBe(KEY);
    expect(id).not.toBe(hex);
  });
});

describe("encryptBlob", () => {
  const { encryptionKey } = deriveSyncKeys(KEY);

  it("round-trips, including non-ASCII text", () => {
    expect(decryptBlob(encryptBlob(blob, encryptionKey, nonce), encryptionKey)).toEqual(blob);
  });

  it("doesn't contain the plaintext", () => {
    const hex = encryptBlob(blob, encryptionKey, nonce);
    const secret = Buffer.from("ein privates Detail").toString("hex");
    expect(hex).not.toContain(secret);
  });

  it("rejects a wrong key", () => {
    const hex = encryptBlob(blob, encryptionKey, nonce);
    const other = deriveSyncKeys("cd".repeat(32)).encryptionKey;
    expect(() => decryptBlob(hex, other)).toThrow();
  });

  it("rejects tampered data", () => {
    const hex = encryptBlob(blob, encryptionKey, nonce);
    const flipped = hex.slice(0, -1) + (hex.endsWith("0") ? "1" : "0");
    expect(() => decryptBlob(flipped, encryptionKey)).toThrow();
  });
});
