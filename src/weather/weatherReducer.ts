import { currentWeatherFrom, type CurrentWeather, type WeatherFailure, type WeatherPermission, type WeatherState } from "./weather.types";

export type WeatherAction =
  | { type: "permission-checked"; permission: WeatherPermission }
  | { type: "request-started"; requestId: number; at: number }
  | { type: "request-succeeded"; requestId: number; data: CurrentWeather }
  | { type: "request-failed"; requestId: number; error: WeatherFailure; at: number };

export const INITIAL_WEATHER_STATE: WeatherState = { status: "checking-permission" };

export function weatherReducer(state: WeatherState, action: WeatherAction): WeatherState {
  if (action.type === "permission-checked") {
    if (action.permission === "granted") return { status: "idle" };
    if (action.permission === "prompt") return { status: "permission-required" };
    if (action.permission === "denied") {
      return { status: "denied", error: { code: "permission-denied", message: "Location access is blocked." } };
    }
    return { status: "unsupported", error: { code: "unsupported", message: "Location is not supported by this browser." } };
  }

  if (action.type === "request-started") {
    return { status: "loading", requestId: action.requestId, startedAt: action.at, previous: currentWeatherFrom(state) };
  }

  if (state.status !== "loading" || state.requestId !== action.requestId) return state;
  if (action.type === "request-succeeded") return { status: "ready", data: action.data };
  if (action.error.code === "permission-denied") return { status: "denied", error: action.error };
  if (action.error.code === "unsupported") return { status: "unsupported", error: action.error };
  return { status: "error", error: action.error, attemptedAt: action.at, previous: state.previous };
}
