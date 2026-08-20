import { describe, expect, it } from "vitest";
import { normalizeNestData } from "./nestRepository";

describe("Nest persistence schema", () => {
  it("restores defaults around partial V2 data", () => {
    const data = normalizeNestData({ version: 2, settings: { environmentId: "sunset", ambient: { wind: 150 }, youtubeVolume: -5 } });
    expect(data.settings.environmentId).toBe("sunset");
    expect(data.settings.ambient).toEqual({ rain: 34, cafe: 12, wind: 100, city: 8 });
    expect(data.settings.youtubeVolume).toBe(0);
    expect(data.sources).toEqual([]);
  });

  it("rejects unknown schema versions", () => {
    expect(normalizeNestData({ version: 999, settings: { environmentId: "midnight" } }).settings.environmentId).toBe("tokyo");
  });

  it("drops deeply corrupted records instead of passing them to the UI", () => {
    const data = normalizeNestData({
      version: 2,
      settings: {},
      sources: [{ id: "bad", name: "Bad", url: "javascript:alert(1)", createdAt: "yesterday" }],
      spaces: [{ id: "bad", name: "Bad", createdAt: 42 }],
      history: [{ id: "bad", task: "Bad", minutes: "many", startedAt: "never", endedAt: "later" }],
      activeSession: { task: "Bad", startedAt: "now" },
      breakState: { startedAt: 20, endsAt: 10 },
    });
    expect(data.sources).toEqual([]);
    expect(data.spaces).toEqual([]);
    expect(data.history).toEqual([]);
    expect(data.activeSession).toBeNull();
    expect(data.breakState).toBeNull();
  });
});
