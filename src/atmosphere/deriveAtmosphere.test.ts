import { describe, expect, it } from "vitest";
import { deriveAtmosphere, localTimeOfDay } from "./deriveAtmosphere";

const outside = { temperature: 18, weatherCode: 61, isDay: true, kind: "rain" as const, observedAt: 100 };

describe("deriveAtmosphere", () => {
  it("combines outside weather with time without letting weather replace time", () => {
    expect(deriveAtmosphere({ mode: "outside", manualWeather: "snow" }, outside, new Date(2026, 7, 20, 14))).toMatchObject({
      weather: "rain",
      timeOfDay: "day",
      temperature: 18,
      source: "outside",
    });
    expect(localTimeOfDay(new Date(2026, 7, 20, 2), false)).toBe("night");
  });

  it("gives manual selection precedence until outside mode returns", () => {
    expect(deriveAtmosphere({ mode: "manual", manualWeather: "snow" }, outside, new Date(2026, 7, 20, 14)).weather).toBe("snow");
    expect(deriveAtmosphere({ mode: "rain", manualWeather: "clear" }, outside, new Date(2026, 7, 20, 14)).weather).toBe("rain");
  });
});
