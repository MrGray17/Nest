import { useCallback, useEffect, useReducer, useRef } from "react";
import { getLocalWeather, queryWeatherPermission, weatherFailureFrom } from "./weatherService";
import { INITIAL_WEATHER_STATE, weatherReducer } from "./weatherReducer";
import { currentWeatherFrom, type WeatherState } from "./weather.types";

const REFRESH_INTERVAL_MS = 30 * 60_000;
const REFRESH_CHECK_MS = 60_000;

function shouldRefresh(state: WeatherState, now: number): boolean {
  const current = currentWeatherFrom(state);
  if (current) return now - current.observedAt >= REFRESH_INTERVAL_MS;
  return state.status === "error" && now - state.attemptedAt >= REFRESH_INTERVAL_MS;
}

export function useWeather(enabled: boolean) {
  const [state, dispatch] = useReducer(weatherReducer, INITIAL_WEATHER_STATE);
  const sequence = useRef(0);
  const stateRef = useRef(state);
  const enabledRef = useRef(enabled);
  stateRef.current = state;
  enabledRef.current = enabled;

  const refresh = useCallback(async () => {
    const requestId = ++sequence.current;
    dispatch({ type: "request-started", requestId, at: Date.now() });
    try {
      const data = await getLocalWeather();
      dispatch({ type: "request-succeeded", requestId, data });
    } catch (error) {
      dispatch({ type: "request-failed", requestId, error: weatherFailureFrom(error), at: Date.now() });
    }
  }, []);

  useEffect(() => {
    let active = true;
    void queryWeatherPermission().then((permission) => {
      if (!active) return;
      dispatch({ type: "permission-checked", permission });
      if (permission === "granted" && enabledRef.current) void refresh();
    });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (enabled && state.status === "idle") void refresh();
  }, [enabled, refresh, state.status]);

  useEffect(() => {
    if (!enabled) return;
    const refreshIfStale = () => {
      if (document.visibilityState === "visible" && shouldRefresh(stateRef.current, Date.now())) void refresh();
    };
    const interval = window.setInterval(refreshIfStale, REFRESH_CHECK_MS);
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, [enabled, refresh]);

  return { state, requestPermission: refresh, refresh };
}
