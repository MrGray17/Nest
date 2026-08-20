import { describe, expect, it } from "vitest";
import { ENVIRONMENTS, ENVIRONMENT_MAP } from "./environments";

const TIMES = ["dawn", "day", "sunset", "night"] as const;

describe("environment configuration", () => {
  it("defines exactly the three V1 rooms with a complete authored time-of-day set", () => {
    expect(ENVIRONMENTS.map((environment) => environment.id)).toEqual(["tokyo", "sunset", "midnight"]);

    const allAssets = ENVIRONMENTS.flatMap((environment) => TIMES.map((time) => environment.assets[time]));
    expect(allAssets).toHaveLength(12);
    expect(new Set(allAssets).size).toBe(12);

    for (const environment of ENVIRONMENTS) {
      for (const time of TIMES) {
        expect(environment.assets[time]).toMatch(/\.jpg$/);
      }
    }
  });

  it("keeps renderer lookup and ambient channels complete", () => {
    for (const environment of ENVIRONMENTS) {
      expect(ENVIRONMENT_MAP[environment.id]).toBe(environment);
      expect(environment.channels.length).toBeGreaterThan(0);
    }
  });
});
