// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLocalWeather, normalizeWeatherResponse, queryWeatherPermission, WeatherServiceError } from "./weatherService";

const position = {
  coords: { latitude: 33.57, longitude: -7.59 },
} as GeolocationPosition;

function geolocationWith(result: "success" | 1 | 2 | 3) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (success: PositionCallback, error: PositionErrorCallback) => {
        if (result === "success") success(position);
        else error({ code: result, message: "failure" } as GeolocationPositionError);
      },
    },
  });
}

describe("weather service", () => {
  beforeEach(() => {
    geolocationWith("success");
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: vi.fn().mockResolvedValue({ state: "prompt" }) },
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  it.each(["granted", "prompt", "denied"] as const)("reports %s permission without prompting", async (state) => {
    vi.mocked(navigator.permissions.query).mockResolvedValue({ state } as PermissionStatus);
    await expect(queryWeatherPermission()).resolves.toBe(state);
  });

  it("normalizes a successful day and night response", () => {
    expect(normalizeWeatherResponse({ current: { temperature_2m: 18.4, weather_code: 61, is_day: 1 } }, 500)).toEqual({
      temperature: 18.4,
      weatherCode: 61,
      isDay: true,
      kind: "rain",
      observedAt: 500,
    });
    expect(normalizeWeatherResponse({ current: { temperature_2m: -2, weather_code: 75, is_day: 0 } }, 600)).toMatchObject({ isDay: false, kind: "snow" });
  });

  it("rejects incomplete responses", () => {
    expect(() => normalizeWeatherResponse({ current: { weather_code: 61 } })).toThrow(WeatherServiceError);
  });

  it("requests local weather without leaking location into storage", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ current: { temperature_2m: 21, weather_code: 0, is_day: 1 } }), { status: 200 }));
    await expect(getLocalWeather()).resolves.toMatchObject({ temperature: 21, kind: "clear", isDay: true });
    const requested = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(requested.searchParams.get("latitude")).toBe("33.57");
    expect(requested.searchParams.get("current")).toContain("weather_code");
  });

  it.each([
    [1, "permission-denied"],
    [2, "position-unavailable"],
    [3, "timeout"],
  ] as const)("maps geolocation failure %s", async (code, expected) => {
    geolocationWith(code);
    await expect(getLocalWeather()).rejects.toMatchObject({ failure: { code: expected } });
  });

  it("maps network and HTTP failures", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    await expect(getLocalWeather()).rejects.toMatchObject({ failure: { code: "network" } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response("no", { status: 503 }));
    await expect(getLocalWeather()).rejects.toMatchObject({ failure: { code: "network" } });
  });

  it("maps malformed JSON and malformed payloads", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("not json", { status: 200 }));
    await expect(getLocalWeather()).rejects.toMatchObject({ failure: { code: "invalid-response" } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ current: {} }), { status: 200 }));
    await expect(getLocalWeather()).rejects.toMatchObject({ failure: { code: "invalid-response" } });
  });
});
