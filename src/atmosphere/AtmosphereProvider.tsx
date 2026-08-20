import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useNow } from "../hooks/useNow";
import { readAtmospherePreferences, writeAtmospherePreferences } from "../persistence/atmospherePreferencesRepository";
import { currentWeatherFrom, type WeatherKind, type WeatherState } from "../weather/weather.types";
import { useWeather } from "../weather/useWeather";
import { deriveAtmosphere } from "./deriveAtmosphere";
import type { Atmosphere, AtmospherePreferences, WeatherMode } from "./atmosphere.types";

type AtmosphereContextValue = {
  atmosphere: Atmosphere;
  preferences: AtmospherePreferences;
  weatherState: WeatherState;
  setMode: (mode: WeatherMode) => void;
  chooseWeather: (weather: WeatherKind) => void;
  requestOutsideWeather: () => Promise<void>;
  refreshOutsideWeather: () => Promise<void>;
};

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null);

export function AtmosphereProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState(readAtmospherePreferences);
  const weather = useWeather(preferences.mode === "outside");
  const now = useNow(60_000);

  useEffect(() => {
    try {
      writeAtmospherePreferences(preferences);
    } catch {
      // Weather preferences are optional; the rest of Nest remains usable.
    }
  }, [preferences]);

  const atmosphere = useMemo(
    () => deriveAtmosphere(preferences, currentWeatherFrom(weather.state), new Date(now)),
    [now, preferences, weather.state],
  );

  const value = useMemo<AtmosphereContextValue>(() => ({
    atmosphere,
    preferences,
    weatherState: weather.state,
    setMode: (mode) => setPreferences((current) => ({ ...current, mode })),
    chooseWeather: (manualWeather) => setPreferences({ mode: "manual", manualWeather }),
    requestOutsideWeather: weather.requestPermission,
    refreshOutsideWeather: weather.refresh,
  }), [atmosphere, preferences, weather.refresh, weather.requestPermission, weather.state]);

  return <AtmosphereContext.Provider value={value}>{children}</AtmosphereContext.Provider>;
}

export function useAtmosphere(): AtmosphereContextValue {
  const context = useContext(AtmosphereContext);
  if (!context) throw new Error("useAtmosphere must be used inside AtmosphereProvider.");
  return context;
}
