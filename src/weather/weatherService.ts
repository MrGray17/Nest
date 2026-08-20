import { weatherKindFromCode } from "./normalizeWeather";
import type { CurrentWeather, WeatherFailure, WeatherPermission } from "./weather.types";

export class WeatherServiceError extends Error {
  constructor(readonly failure: WeatherFailure) {
    super(failure.message);
    this.name = "WeatherServiceError";
  }
}

let inFlightRequest: Promise<CurrentWeather> | null = null;

function failure(code: WeatherFailure["code"], message: string): WeatherServiceError {
  return new WeatherServiceError({ code, message });
}

export async function queryWeatherPermission(): Promise<WeatherPermission> {
  if (!("geolocation" in navigator)) return "unsupported";
  if (!("permissions" in navigator)) return "prompt";
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state;
  } catch {
    return "prompt";
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(failure("unsupported", "Location is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      if (error.code === 1) reject(failure("permission-denied", "Location access was not allowed."));
      else if (error.code === 3) reject(failure("timeout", "Location took too long to respond."));
      else reject(failure("position-unavailable", "Your current location is unavailable."));
    }, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 15 * 60_000,
    });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeWeatherResponse(value: unknown, observedAt = Date.now()): CurrentWeather {
  const current = isRecord(value) && isRecord(value.current) ? value.current : {};
  const temperature = current.temperature_2m;
  const weatherCode = current.weather_code;
  const isDay = current.is_day;
  if (typeof temperature !== "number" || typeof weatherCode !== "number" || typeof isDay !== "number") {
    throw failure("invalid-response", "The weather service returned incomplete data.");
  }
  return {
    temperature,
    weatherCode,
    isDay: isDay === 1,
    kind: weatherKindFromCode(weatherCode),
    observedAt,
  };
}

async function requestLocalWeather(): Promise<CurrentWeather> {
  const position = await getPosition();
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(position.coords.latitude));
  url.searchParams.set("longitude", String(position.coords.longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw failure("network", "Nest couldn't reach the weather service.");
  }
  if (!response.ok) throw failure("network", "Nest couldn't reach the weather service.");

  try {
    return normalizeWeatherResponse(await response.json() as unknown);
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw failure("invalid-response", "The weather service returned unreadable data.");
  }
}

export function getLocalWeather(): Promise<CurrentWeather> {
  inFlightRequest ??= requestLocalWeather().finally(() => {
    inFlightRequest = null;
  });
  return inFlightRequest;
}

export function weatherFailureFrom(error: unknown): WeatherFailure {
  if (error instanceof WeatherServiceError) return error.failure;
  return { code: "network", message: "Weather is temporarily unavailable." };
}
