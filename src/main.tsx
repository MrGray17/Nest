import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { AtmosphereProvider } from "./atmosphere/AtmosphereProvider";
import "./styles/base.css";
import "./styles/scenes.css";
import "./styles/atmosphere.css";
import "./styles/app.css";

let reloadingForServiceWorker = false;
const updateServiceWorker = registerSW({
  immediate: true,
  onRegisteredSW: (_serviceWorkerUrl, registration) => {
    void registration?.update();
  },
  onNeedRefresh: () => {
    void updateServiceWorker(true);
  },
});

navigator.serviceWorker?.addEventListener("controllerchange", () => {
  if (reloadingForServiceWorker) return;
  reloadingForServiceWorker = true;
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AtmosphereProvider><App /></AtmosphereProvider>
  </StrictMode>,
);
