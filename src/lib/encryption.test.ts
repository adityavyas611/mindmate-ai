import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt, hashUserId } from "@/lib/encryption";

const TEST_KEY = "a".repeat(64);

describe("encryption", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  it("encrypts and decrypts journal text", () => {
    const original = "Today I felt anxious about my JEE prep.";
    const encrypted = encrypt(original);
    expect(encrypted).not.toContain(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  it("throws when ENCRYPTION_KEY is missing", () => {
    const prev = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
    process.env.ENCRYPTION_KEY = prev;
  });

  it("hashes user IDs consistently", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(hashUserId(id)).toBe(hashUserId(id));
    expect(hashUserId(id)).not.toBe(id);
  });
});
