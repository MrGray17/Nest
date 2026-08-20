import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AtmosphereProvider } from "./atmosphere/AtmosphereProvider";
import "./styles/base.css";
import "./styles/scenes.css";
import "./styles/atmosphere.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AtmosphereProvider><App /></AtmosphereProvider>
  </StrictMode>,
);
