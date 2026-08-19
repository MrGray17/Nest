import { useEffect, useMemo, useState } from "react";
import { getLocalWeather, type LocalWeather, type WeatherKind } from "./weather";

type WeatherMode = "outside" | "rain" | "manual";

const MODE_KEY = "nest.weather-mode.v1";
const MANUAL_KEY = "nest.manual-weather.v1";

const WEATHER_META: Record<WeatherKind, { label: string; icon: string }> = {
  clear: { label: "Clear", icon: "☀️" },
  cloudy: { label: "Cloudy", icon: "☁️" },
  fog: { label: "Foggy", icon: "🌫️" },
  rain: { label: "Rain", icon: "🌧️" },
  snow: { label: "Snow", icon: "❄️" },
  storm: { label: "Storm", icon: "⛈️" },
};

function readMode(): WeatherMode {
  const value = localStorage.getItem(MODE_KEY);
  return value === "rain" || value === "manual" ? value : "outside";
}

function readManual(): WeatherKind {
  const value = localStorage.getItem(MANUAL_KEY) as WeatherKind | null;
  return value && value in WEATHER_META ? value : "cloudy";
}

function localIsDay() {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 20;
}

function applyWeather(kind: WeatherKind, isDay: boolean, source: WeatherMode) {
  document.body.dataset.weather = kind;
  document.body.dataset.weatherDay = String(isDay);
  document.body.dataset.weatherSource = source;
}

export default function WeatherOverlay() {
  const [weather, setWeather] = useState<LocalWeather | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [mode, setMode] = useState<WeatherMode>(readMode);
  const [manualKind, setManualKind] = useState<WeatherKind>(readManual);
  const [open, setOpen] = useState(false);

  const syntheticWeather = useMemo(() => {
    const kind: WeatherKind = mode === "rain" ? "rain" : manualKind;
    return { kind, ...WEATHER_META[kind], isDay: localIsDay() };
  }, [mode, manualKind]);

  const loadOutside = async (force = false) => {
    setState("loading");
    try {
      const next = await getLocalWeather({ force });
      setWeather(next);
      applyWeather(next.kind, next.isDay, "outside");
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
    if (mode === "outside") {
      void loadOutside();
      return;
    }

    applyWeather(syntheticWeather.kind, syntheticWeather.isDay, mode);
    setState("ready");
  }, [mode, syntheticWeather.kind, syntheticWeather.isDay]);

  useEffect(() => {
    localStorage.setItem(MANUAL_KEY, manualKind);
    if (mode === "manual") applyWeather(manualKind, localIsDay(), "manual");
  }, [manualKind, mode]);

  const shown = mode === "outside" ? weather : syntheticWeather;

  return (
    <div className="weather-control-wrap">
      <button
        className="weather-overlay"
        data-state={state}
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Weather and atmosphere"
      >
        {state === "loading" && mode === "outside" ? (
          <><span>⌖</span><span>Looking outside…</span></>
        ) : state === "error" && mode === "outside" ? (
          <><span>🌧️</span><span>Weather unavailable</span></>
        ) : shown ? (
          <>
            <span aria-hidden="true">{shown.icon}</span>
            {mode === "outside" && weather && <strong>{Math.round(weather.temperature)}°</strong>}
            <span>{shown.label}</span>
          </>
        ) : null}
      </button>

      {open && (
        <aside className="weather-menu">
          <div className="weather-menu-heading">
            <div><span className="menu-kicker">Atmosphere</span><strong>Weather</strong></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close weather menu">×</button>
          </div>

          <button className={mode === "outside" ? "active" : ""} onClick={() => setMode("outside")}>
            <span>⌖</span><div><strong>Match outside</strong><small>Use your real local weather</small></div>
          </button>
          <button className={mode === "rain" ? "active" : ""} onClick={() => setMode("rain")}>
            <span>🌧️</span><div><strong>Always rainy</strong><small>Because sometimes you just want rain</small></div>
          </button>
          <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>
            <span>✦</span><div><strong>Choose a mood</strong><small>Set the sky yourself</small></div>
          </button>

          {mode === "manual" && (
            <div className="weather-grid">
              {(Object.keys(WEATHER_META) as WeatherKind[]).map((kind) => (
                <button
                  key={kind}
                  className={manualKind === kind ? "active" : ""}
                  onClick={() => setManualKind(kind)}
                  title={WEATHER_META[kind].label}
                >
                  <span>{WEATHER_META[kind].icon}</span>
                  <small>{WEATHER_META[kind].label}</small>
                </button>
              ))}
            </div>
          )}

          {mode === "outside" && (
            <button className="weather-refresh" onClick={() => void loadOutside(true)} disabled={state === "loading"}>
              {state === "error" ? "Retry location weather" : "Refresh outside weather"}
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
