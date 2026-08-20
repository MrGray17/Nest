import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { AtmosphereProvider } from "./atmosphere/AtmosphereProvider";
import "./styles/base.css";
import "./styles/scenes.css";
import "./styles/atmosphere.css";
import "./styles/app.css";
import "./styles/time-art.css";

// Register the production PWA immediately, but never force a page reload while
// the user is working. With `registerType: "autoUpdate"`, a new worker can
// activate in the background and will serve the fresh shell on the next normal
// navigation/reload. Forcing `window.location.reload()` from `controllerchange`
// caused real interaction races: an update could interrupt a click, YouTube
// initialization, an accessibility scan, or an active focus session.
registerSW({
  immediate: true,
  onRegisteredSW: (_serviceWorkerUrl, registration) => {
    // Check once at startup so long-lived installed copies discover updates
    // promptly. This does not reload the current document.
    void registration?.update();
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AtmosphereProvider><App /></AtmosphereProvider>
  </StrictMode>,
);
