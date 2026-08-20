import { describe, expect, it, vi } from "vitest";
import { DEFAULT_DATA } from "../domain/types";
import { applySpace, completeFocus, extendFocus, removeSource, startFocus, toggleFocus } from "./nestMutations";

describe("nest mutations", () => {
  it("starts, pauses, extends, and completes a session without UI state", () => {
    const ready = { ...structuredClone(DEFAULT_DATA), settings: { ...DEFAULT_DATA.settings, currentTask: "Ship the timer", durationMinutes: 25 } };
    const started = startFocus(ready, 1_000);
    const paused = toggleFocus(started, 61_000);
    const extended = extendFocus(paused, 10);
    vi.stubGlobal("crypto", { randomUUID: () => "session-1" });
    const finished = completeFocus(extended, 61_000, "Next: integration test");
    expect(finished.activeSession).toBeNull();
    expect(finished.history[0]).toMatchObject({ id: "session-1", task: "Ship the timer", minutes: 1, note: "Next: integration test" });
    expect(finished.settings.currentTask).toBe("");
    vi.unstubAllGlobals();
  });

  it("clears removed sources from preferences and spaces", () => {
    const data = structuredClone(DEFAULT_DATA);
    data.settings.sourceId = "music-1";
    data.sources = [{ id: "music-1", name: "Jazz", url: "https://youtube.com/watch?v=dQw4w9WgXcQ", videoId: "dQw4w9WgXcQ", createdAt: "now" }];
    data.spaces = [{ id: "space-1", name: "Night", environmentId: "midnight", sourceId: "music-1", durationMinutes: 60, layout: "focus", ambient: data.settings.ambient, createdAt: "now" }];
    const next = removeSource(data, "music-1");
    expect(next.settings.sourceId).toBeNull();
    expect(next.spaces[0].sourceId).toBeNull();
  });

  it("restores a saved atmosphere as one atomic change", () => {
    const data = structuredClone(DEFAULT_DATA);
    const next = applySpace(data, { id: "space", name: "Summer Study", environmentId: "sunset", sourceId: null, durationMinutes: 90, layout: "immersive", ambient: { rain: 0, cafe: 0, wind: 25, city: 5 }, createdAt: "now" });
    expect(next.settings).toMatchObject({ environmentId: "sunset", durationMinutes: 90, layout: "immersive", hasEntered: true });
  });

  it("starts open-ended sessions and finishes only once with the correct scene and note", () => {
    const ready = structuredClone(DEFAULT_DATA);
    ready.settings.currentTask = "Read carefully";
    ready.settings.environmentId = "midnight";
    ready.settings.durationMinutes = null;
    const started = startFocus(ready, 1_000);
    expect(started.activeSession).toMatchObject({ task: "Read carefully", environmentId: "midnight", durationMinutes: null, runningSince: 1_000 });

    vi.stubGlobal("crypto", { randomUUID: () => "history-1" });
    const finished = completeFocus(started, 91_000, "Keep the thread");
    const duplicateAttempt = completeFocus(finished, 120_000, "wrong note");
    expect(duplicateAttempt.history).toHaveLength(1);
    expect(duplicateAttempt.history[0]).toMatchObject({
      id: "history-1",
      task: "Read carefully",
      environmentId: "midnight",
      minutes: 2,
      note: "Keep the thread",
    });
    vi.unstubAllGlobals();
  });

  it("keeps newest completed sessions first and does not leak notes", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValueOnce("first").mockReturnValueOnce("second") });
    const ready = structuredClone(DEFAULT_DATA);
    ready.settings.currentTask = "First";
    const first = completeFocus(startFocus(ready, 0), 60_000, "First note");
    first.settings.currentTask = "Second";
    const second = completeFocus(startFocus(first, 120_000), 180_000, "");
    expect(second.history.map((record) => record.id)).toEqual(["second", "first"]);
    expect(second.history[0].note).toBeUndefined();
    expect(second.history[1].note).toBe("First note");
    vi.unstubAllGlobals();
  });
});
