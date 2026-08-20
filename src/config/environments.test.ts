import { describe, expect, it } from "vitest";
import { ENVIRONMENTS, ENVIRONMENT_MAP } from "./environments";

describe("environment configuration", () => {
  it("defines exactly the three V1 rooms with unique assets", () => {
    expect(ENVIRONMENTS.map((environment) => environment.id)).toEqual(["tokyo", "sunset", "midnight"]);
    expect(new Set(ENVIRONMENTS.map((environment) => environment.asset)).size).toBe(3);
  });

  it("keeps renderer lookup and ambient channels complete", () => {
    for (const environment of ENVIRONMENTS) {
      expect(ENVIRONMENT_MAP[environment.id]).toBe(environment);
      expect(environment.channels.length).toBeGreaterThan(0);
    }
  });
});
