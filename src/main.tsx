import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import QuoteWhisper from "./QuoteWhisper";
import WeatherOverlay from "./WeatherOverlay";
import "./styles.css";
import "./weather.css";
import "./quotes.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <WeatherOverlay />
    <QuoteWhisper />
  </StrictMode>,
);
