// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DATA } from "../domain/types";
import { loadNestData, saveNestData } from "./nestRepository";

function deleteNestDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("nest-local");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database deletion was blocked."));
  });
}

describe("Nest IndexedDB repository", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    localStorage.clear();
    await deleteNestDatabase();
  });

  it("returns defaults when storage is missing and restores valid saved state", async () => {
    const missing = await loadNestData();
    expect(missing).toEqual(DEFAULT_DATA);
    const saved = structuredClone(DEFAULT_DATA);
    saved.settings.environmentId = "sunset";
    saved.settings.currentTask = "Persist this";
    await saveNestData(saved);
    await expect(loadNestData()).resolves.toMatchObject({ settings: { environmentId: "sunset", currentTask: "Persist this" } });
  });

  it("persists running sessions as paused recovery snapshots so away time is never invented", async () => {
    const saved = structuredClone(DEFAULT_DATA);
    saved.activeSession = {
      task: "Stay honest",
      environmentId: "tokyo",
      sourceId: null,
      durationMinutes: 25,
      startedAt: 1_000,
      accumulatedMs: 0,
      runningSince: 1_000,
    };

    const now = vi.spyOn(Date, "now").mockReturnValue(61_000);
    await saveNestData(saved);

    now.mockReturnValue(3_661_000);
    const restored = await loadNestData();
    expect(restored.activeSession).toMatchObject({
      task: "Stay honest",
      accumulatedMs: 60_000,
      runningSince: null,
    });
  });

  it("ignores malformed legacy JSON", async () => {
    localStorage.setItem("nest.history.v1", "{not-json");
    localStorage.setItem("nest.active-session.v1", "also bad");
    await expect(loadNestData()).resolves.toMatchObject({ history: [], activeSession: null });
  });

  it("migrates valid legacy place and history data", async () => {
    localStorage.setItem("nest.place.v1", JSON.stringify("library"));
    localStorage.setItem("nest.history.v1", JSON.stringify([{ id: "old", task: "Read", startedAt: "2026-01-01T00:00:00.000Z", endedAt: "2026-01-01T00:25:00.000Z", minutes: 25, note: "Done" }]));
    const migrated = await loadNestData();
    expect(migrated.settings.environmentId).toBe("midnight");
    expect(migrated.history[0]).toMatchObject({ id: "old", task: "Read", minutes: 25, note: "Done" });
  });

  it("surfaces unavailable storage instead of returning invented data", async () => {
    const failure = vi.spyOn(indexedDB, "open").mockImplementation(() => { throw new Error("blocked"); });
    await expect(loadNestData()).rejects.toThrow("blocked");
    failure.mockRestore();
  });
});
