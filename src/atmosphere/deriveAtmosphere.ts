import type { CurrentWeather } from "../weather/weather.types";
import type { Atmosphere, AtmospherePreferences, AtmosphereSource, TimeOfDay } from "./atmosphere.types";

export function localTimeOfDay(date: Date, isDayHint?: boolean): TimeOfDay {
  if (isDayHint === false) return "night";
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < 5 || hour >= 21) return "night";
  if (hour < 8) return "dawn";
  if (hour >= 17.5) return "sunset";
  return "day";
}

export function deriveAtmosphere(
  preferences: AtmospherePreferences,
  currentWeather: CurrentWeather | null,
  now: Date,
): Atmosphere {
  const usesOutside = preferences.mode === "outside";
  const weather = usesOutside ? currentWeather?.kind ?? "clear" : preferences.mode === "rain" ? "rain" : preferences.manualWeather;
  const source: AtmosphereSource = usesOutside ? "outside" : "manual";
  const timeOfDay = localTimeOfDay(now, usesOutside ? currentWeather?.isDay : undefined);
  return {
    weather,
    source,
    timeOfDay,
    isDay: timeOfDay !== "night",
    temperature: usesOutside ? currentWeather?.temperature ?? null : null,
  };
}
