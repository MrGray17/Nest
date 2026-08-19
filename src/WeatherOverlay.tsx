import { useEffect, useState } from "react";
import { getLocalWeather, type LocalWeather } from "./weather";

function applyWeatherToDocument(weather: LocalWeather | null) {
  if (!weather) return;
  document.body.dataset.weather = weather.kind;
  document.body.dataset.weatherDay = String(weather.isDay);
}

export default function WeatherOverlay() {
  const [weather, setWeather] = useState<LocalWeather | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const loadWeather = async (force = false) => {
    setState("loading");
    try {
      const next = await getLocalWeather({ force });
      setWeather(next);
      applyWeatherToDocument(next);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    void loadWeather();

    return () => {
      delete document.body.dataset.weather;
      delete document.body.dataset.weatherDay;
    };
  }, []);

  if (state === "loading") {
    return (
      <button className="weather-overlay" data-state="loading" type="button" disabled>
        <span>⌖</span>
        <span>Looking outside…</span>
      </button>
    );
  }

  if (state === "error" || !weather) {
    return (
      <button
        className="weather-overlay"
        data-state="error"
        type="button"
        onClick={() => void loadWeather(true)}
        title="Allow location access to match Nest to the weather outside"
      >
        <span>🌧️</span>
        <span>Weather unavailable · retry</span>
      </button>
    );
  }

  return (
    <button
      className="weather-overlay"
      data-state="ready"
      type="button"
      onClick={() => void loadWeather(true)}
      title="Refresh local weather"
      aria-label={`Current weather: ${Math.round(weather.temperature)} degrees Celsius and ${weather.label}. Refresh weather.`}
    >
      <span aria-hidden="true">{weather.icon}</span>
      <strong>{Math.round(weather.temperature)}°</strong>
      <span>{weather.label}</span>
    </button>
  );
}
