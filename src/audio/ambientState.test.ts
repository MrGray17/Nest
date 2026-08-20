import { describe, expect, it } from "vitest";
import { mixForEnvironment, normalizeMix } from "./ambientState";

describe("ambient state", () => {
  it("clamps external values to safe percentages", () => {
    expect(normalizeMix({ rain: 135, cafe: -4, wind: 12.6, city: 5 })).toEqual({ rain: 100, cafe: 0, wind: 13, city: 5 });
  });

  it("silences channels that do not belong to the current environment", () => {
    expect(mixForEnvironment({ rain: 20, cafe: 10, wind: 30, city: 5 }, "sunset")).toEqual({ rain: 0, cafe: 0, wind: 30, city: 5 });
  });
});
