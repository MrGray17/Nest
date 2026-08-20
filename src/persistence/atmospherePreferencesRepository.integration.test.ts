// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readAtmospherePreferences, writeAtmospherePreferences } from "./atmospherePreferencesRepository";

describe("atmosphere preference repository", () => {
  beforeEach(() => localStorage.clear());

  it("uses defaults for missing and malformed storage", () => {
    expect(readAtmospherePreferences()).toEqual({ mode: "outside", manualWeather: "cloudy" });
    localStorage.setItem("nest.atmosphere.v1", "{broken");
    expect(readAtmospherePreferences()).toEqual({ mode: "outside", manualWeather: "cloudy" });
  });

  it("persists valid versioned data and migrates legacy preferences", () => {
    writeAtmospherePreferences({ mode: "manual", manualWeather: "snow" });
    expect(readAtmospherePreferences()).toEqual({ mode: "manual", manualWeather: "snow" });
    localStorage.removeItem("nest.atmosphere.v1");
    localStorage.setItem("nest.weather-mode.v1", "rain");
    localStorage.setItem("nest.manual-weather.v1", "storm");
    expect(readAtmospherePreferences()).toEqual({ mode: "rain", manualWeather: "storm" });
  });

  it("falls back safely when storage reads fail", () => {
    const failure = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readAtmospherePreferences()).toEqual({ mode: "outside", manualWeather: "cloudy" });
    failure.mockRestore();
  });
});
