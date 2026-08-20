import { describe, expect, it } from "vitest";
import { ENVIRONMENTS, ENVIRONMENT_MAP } from "./environments";

const TIMES = ["dawn", "day", "sunset", "night"] as const;

describe("environment configuration", () => {
  it("defines exactly the three V1 rooms with a complete authored time-of-day set", () => {
    expect(ENVIRONMENTS.map((environment) => environment.id)).toEqual(["tokyo", "sunset", "midnight"]);

    const baseAssets = ENVIRONMENTS.map((environment) => environment.baseAsset);
    expect(new Set(baseAssets).size).toBe(3);
    for (const asset of baseAssets) expect(asset).toMatch(/\.jpg$/);

    const timeArt = ENVIRONMENTS.flatMap((environment) => TIMES.map((time) => environment.timeArt[time]));
    expect(timeArt).toHaveLength(12);
    expect(new Set(timeArt).size).toBe(12);
    for (const asset of timeArt) expect(asset).toMatch(/\.svg$/);
  });

  it("keeps renderer lookup and ambient channels complete", () => {
    for (const environment of ENVIRONMENTS) {
      expect(ENVIRONMENT_MAP[environment.id]).toBe(environment);
      expect(environment.channels.length).toBeGreaterThan(0);
    }
  });
});
