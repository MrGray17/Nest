import type { AtmospherePreferences, WeatherMode } from "../atmosphere/atmosphere.types";
import { WEATHER_META, type WeatherKind } from "../weather/weather.types";

const PREFERENCES_KEY = "nest.atmosphere.v1";
const LEGACY_MODE_KEY = "nest.weather-mode.v1";
const LEGACY_MANUAL_KEY = "nest.manual-weather.v1";
const DEFAULT_PREFERENCES: AtmospherePreferences = { mode: "outside", manualWeather: "cloudy" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function weatherMode(value: unknown): WeatherMode {
  return value === "rain" || value === "manual" ? value : "outside";
}

function weatherKind(value: unknown): WeatherKind {
  return typeof value === "string" && value in WEATHER_META ? value as WeatherKind : DEFAULT_PREFERENCES.manualWeather;
}

export function normalizeAtmospherePreferences(value: unknown): AtmospherePreferences {
  if (!isRecord(value) || value.version !== 1) return DEFAULT_PREFERENCES;
  return { mode: weatherMode(value.mode), manualWeather: weatherKind(value.manualWeather) };
}

export function readAtmospherePreferences(): AtmospherePreferences {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    if (saved) return normalizeAtmospherePreferences(JSON.parse(saved) as unknown);
    return {
      mode: weatherMode(localStorage.getItem(LEGACY_MODE_KEY)),
      manualWeather: weatherKind(localStorage.getItem(LEGACY_MANUAL_KEY)),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writeAtmospherePreferences(preferences: AtmospherePreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ version: 1, ...preferences }));
}
