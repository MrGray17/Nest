export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

export type LocalWeather = {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  kind: WeatherKind;
  label: string;
  icon: string;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
};

function weatherFromCode(code: number): Pick<LocalWeather, "kind" | "label" | "icon"> {
  if (code === 0) return { kind: "clear", label: "Clear", icon: "☀️" };
  if (code >= 1 && code <= 3) return { kind: "cloudy", label: "Cloudy", icon: "☁️" };
  if (code === 45 || code === 48) return { kind: "fog", label: "Foggy", icon: "🌫️" };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { kind: "rain", label: "Rain", icon: "🌧️" };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { kind: "snow", label: "Snow", icon: "❄️" };
  }
  if (code >= 95 && code <= 99) return { kind: "storm", label: "Storm", icon: "⛈️" };
  return { kind: "cloudy", label: "Cloudy", icon: "☁️" };
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 15 * 60_000,
    });
  });
}

export async function getLocalWeather(): Promise<LocalWeather> {
  const position = await getPosition();
  const { latitude, longitude } = position.coords;
  const url = new URL("https://api.open-meteo.com/v1/forecast");

  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather request failed (${response.status}).`);

  const data = (await response.json()) as OpenMeteoResponse;
  const temperature = data.current?.temperature_2m;
  const weatherCode = data.current?.weather_code;
  const isDay = data.current?.is_day;

  if (typeof temperature !== "number" || typeof weatherCode !== "number" || typeof isDay !== "number") {
    throw new Error("Weather service returned incomplete data.");
  }

  const condition = weatherFromCode(weatherCode);

  return {
    temperature,
    weatherCode,
    isDay: isDay === 1,
    ...condition,
  };
}
