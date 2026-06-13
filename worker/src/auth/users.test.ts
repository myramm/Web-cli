import { describe, expect, it } from "vitest";
import { MemoryStorageBackend } from "../storage/memory-backend";
import {
  authenticate,
  createUser,
  getTheme,
  getUserByTelegram,
  linkTelegram,
  loadUsers,
  setTheme,
  unlinkTelegram,
} from "./users";

describe("webui users", () => {
  it("creates and authenticates user", async () => {
    const storage = new MemoryStorageBackend();
    const created = await createUser(storage, "alice", "secret12");
    expect(created.ok).toBe(true);
    expect((await loadUsers(storage)).length).toBe(1);

    const user = await authenticate(storage, "alice", "secret12");
    expect(user?.username).toBe("alice");
    expect(await authenticate(storage, "alice", "nope")).toBeNull();
  });

  it("rejects invalid username", async () => {
    const storage = new MemoryStorageBackend();
    const result = await createUser(storage, "X", "secret12");
    expect(result.ok).toBe(false);
  });

  it("linkTelegram and unlinkTelegram manage chat id", async () => {
    const storage = new MemoryStorageBackend();
    await createUser(storage, "alice", "secret12");
    expect(await linkTelegram(storage, "alice", 4242)).toBe(true);
    expect((await getUserByTelegram(storage, 4242))?.username).toBe("alice");
    expect(await unlinkTelegram(storage, "alice")).toBe(true);
    expect(await getUserByTelegram(storage, 4242)).toBeNull();
  });

  it("setTheme updates user preference", async () => {
    const storage = new MemoryStorageBackend();
    await createUser(storage, "alice", "secret12");
    expect(getTheme(await authenticate(storage, "alice", "secret12"))).toBe("dark");
    expect(await setTheme(storage, "alice", "light")).toBe(true);
    const user = await authenticate(storage, "alice", "secret12");
    expect(getTheme(user)).toBe("light");
    expect(await setTheme(storage, "alice", "nope")).toBe(false);
  });
});