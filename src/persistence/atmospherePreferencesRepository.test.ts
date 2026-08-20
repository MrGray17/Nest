import { describe, expect, it } from "vitest";
import { normalizeAtmospherePreferences } from "./atmospherePreferencesRepository";

describe("atmosphere preference schema", () => {
  it("accepts valid versioned preferences", () => {
    expect(normalizeAtmospherePreferences({ version: 1, mode: "manual", manualWeather: "snow" })).toEqual({ mode: "manual", manualWeather: "snow" });
  });

  it("rejects malformed or unknown versions", () => {
    expect(normalizeAtmospherePreferences({ version: 2, mode: "manual", manualWeather: "storm" })).toEqual({ mode: "outside", manualWeather: "cloudy" });
    expect(normalizeAtmospherePreferences({ version: 1, mode: "nonsense", manualWeather: "lava" })).toEqual({ mode: "outside", manualWeather: "cloudy" });
  });
});
