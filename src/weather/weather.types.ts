export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

export type CurrentWeather = Readonly<{
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  kind: WeatherKind;
  observedAt: number;
}>;

export type WeatherFailure = Readonly<{
  code: "permission-denied" | "position-unavailable" | "timeout" | "network" | "invalid-response" | "unsupported";
  message: string;
}>;

export type WeatherPermission = "granted" | "prompt" | "denied" | "unsupported";

export type WeatherState =
  | { status: "checking-permission" }
  | { status: "permission-required" }
  | { status: "idle" }
  | { status: "loading"; requestId: number; startedAt: number; previous: CurrentWeather | null }
  | { status: "ready"; data: CurrentWeather }
  | { status: "denied"; error: WeatherFailure }
  | { status: "unsupported"; error: WeatherFailure }
  | { status: "error"; error: WeatherFailure; attemptedAt: number; previous: CurrentWeather | null };

export const WEATHER_META: Record<WeatherKind, { label: string; icon: string }> = {
  clear: { label: "Clear", icon: "☀️" },
  cloudy: { label: "Cloudy", icon: "☁️" },
  fog: { label: "Fog", icon: "🌫️" },
  rain: { label: "Rain", icon: "🌧️" },
  snow: { label: "Snow", icon: "❄️" },
  storm: { label: "Storm", icon: "⛈️" },
};

export function currentWeatherFrom(state: WeatherState): CurrentWeather | null {
  if (state.status === "ready") return state.data;
  if (state.status === "loading" || state.status === "error") return state.previous;
  return null;
}
