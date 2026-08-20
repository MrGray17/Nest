import { describe, expect, it } from "vitest";
import { weatherKindFromCode } from "./normalizeWeather";
import { INITIAL_WEATHER_STATE, weatherReducer } from "./weatherReducer";

const weather = { temperature: 18, weatherCode: 61, isDay: true, kind: "rain" as const, observedAt: 100 };

describe("weather normalization", () => {
  it.each([[0, "clear"], [2, "cloudy"], [45, "fog"], [61, "rain"], [75, "snow"], [96, "storm"], [100, "cloudy"]] as const)(
    "maps Open-Meteo code %s to %s",
    (code, expected) => expect(weatherKindFromCode(code)).toBe(expected),
  );
});

describe("weather lifecycle", () => {
  it("does not let a stale request replace newer weather", () => {
    const first = weatherReducer(INITIAL_WEATHER_STATE, { type: "request-started", requestId: 1, at: 1 });
    const second = weatherReducer(first, { type: "request-started", requestId: 2, at: 2 });
    const stale = weatherReducer(second, { type: "request-succeeded", requestId: 1, data: weather });
    expect(stale).toEqual(second);
    expect(weatherReducer(stale, { type: "request-succeeded", requestId: 2, data: weather })).toEqual({ status: "ready", data: weather });
  });

  it("models denied permission explicitly", () => {
    expect(weatherReducer(INITIAL_WEATHER_STATE, { type: "permission-checked", permission: "denied" })).toMatchObject({
      status: "denied",
      error: { code: "permission-denied" },
    });
  });
});
