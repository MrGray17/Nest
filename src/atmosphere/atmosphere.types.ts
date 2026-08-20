import type { WeatherKind } from "../weather/weather.types";

export type WeatherMode = "outside" | "rain" | "manual";
export type AtmosphereSource = "outside" | "manual";
export type TimeOfDay = "dawn" | "day" | "sunset" | "night";

export type Atmosphere = Readonly<{
  weather: WeatherKind;
  isDay: boolean;
  timeOfDay: TimeOfDay;
  temperature: number | null;
  source: AtmosphereSource;
}>;

export type AtmospherePreferences = Readonly<{
  mode: WeatherMode;
  manualWeather: WeatherKind;
}>;
