import { CloudSun, LocateFixed, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAtmosphere } from "../atmosphere/AtmosphereProvider";
import { useNow } from "../hooks/useNow";
import { currentWeatherFrom, WEATHER_META, type WeatherKind } from "../weather/weather.types";

const WEATHER_KINDS = Object.keys(WEATHER_META) as WeatherKind[];

export default function WeatherControl({ variant }: { variant: "arrival" | "room" }) {
  const { atmosphere, preferences, weatherState, setMode, chooseWeather, requestOutsideWeather, refreshOutsideWeather } = useAtmosphere();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLButtonElement>(null);
  const now = useNow(30_000);
  const outside = currentWeatherFrom(weatherState);
  const meta = WEATHER_META[atmosphere.weather];
  const time = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const needsPermission = weatherState.status === "permission-required" || weatherState.status === "denied" || weatherState.status === "unsupported";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        summaryRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    summaryRef.current?.focus();
  };

  const summary = needsPermission && preferences.mode === "outside"
    ? "Match weather outside"
    : `${outside && preferences.mode === "outside" ? `${Math.round(outside.temperature)}° · ` : ""}${meta.label}`;

  return (
    <div className={`weather-control weather-control-${variant}`} ref={rootRef}>
      <button
        ref={summaryRef}
        type="button"
        className="weather-summary"
        aria-label="Weather and local time"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="weather-time">{atmosphere.isDay ? "☀" : "☾"} {time}</span>
        <span className="weather-separator" aria-hidden="true">·</span>
        <span aria-hidden="true">{needsPermission && preferences.mode === "outside" ? "🌦️" : meta.icon}</span>
        <span>{summary}</span>
      </button>

      {open && (
        <aside className="weather-popover" aria-label="Weather settings">
          <header>
            <div><small>Atmosphere</small><strong>Weather</strong></div>
            <button type="button" onClick={closeAndRestoreFocus} aria-label="Close weather settings"><X size={15} /></button>
          </header>

          <div className="weather-modes">
            <button type="button" className={preferences.mode === "outside" ? "is-active" : ""} onClick={() => setMode("outside")}>
              <LocateFixed size={16} /><span><strong>Match outside</strong><small>Use your local weather</small></span>
            </button>
            <button type="button" className={preferences.mode === "rain" ? "is-active" : ""} onClick={() => setMode("rain")}>
              <span aria-hidden="true">🌧️</span><span><strong>Always rainy</strong><small>Keep rain in every room</small></span>
            </button>
            <button type="button" className={preferences.mode === "manual" ? "is-active" : ""} onClick={() => setMode("manual")}>
              <CloudSun size={16} /><span><strong>Choose a mood</strong><small>Set the sky yourself</small></span>
            </button>
          </div>

          {preferences.mode === "outside" && needsPermission && (
            <div className="weather-permission">
              <strong>🌦️ Match Nest to the weather outside</strong>
              <p>Your location is used only to retrieve local weather. It is never saved.</p>
              {weatherState.status === "denied" ? (
                <p role="status">Location is blocked in this browser. Manual weather still works normally.</p>
              ) : weatherState.status === "unsupported" ? (
                <p role="status">Location is unavailable here. Choose a weather mood instead.</p>
              ) : (
                <button type="button" onClick={() => void requestOutsideWeather()}>Allow location</button>
              )}
            </div>
          )}

          {preferences.mode === "outside" && weatherState.status === "loading" && <p className="weather-feedback" role="status">Looking outside…</p>}
          {preferences.mode === "outside" && weatherState.status === "error" && (
            <div className="weather-feedback" role="alert">
              <span>{weatherState.error.message}</span>
              <button type="button" onClick={() => void refreshOutsideWeather()}><RefreshCw size={13} /> Try again</button>
            </div>
          )}
          {preferences.mode === "outside" && weatherState.status === "ready" && (
            <button type="button" className="weather-refresh" onClick={() => void refreshOutsideWeather()}>
              <RefreshCw size={13} /> Refresh weather
            </button>
          )}

          {preferences.mode === "manual" && (
            <div className="weather-grid" aria-label="Choose weather">
              {WEATHER_KINDS.map((kind) => (
                <button type="button" key={kind} className={atmosphere.weather === kind ? "is-active" : ""} onClick={() => chooseWeather(kind)} aria-label={WEATHER_META[kind].label}>
                  <span aria-hidden="true">{WEATHER_META[kind].icon}</span><small>{WEATHER_META[kind].label}</small>
                </button>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
