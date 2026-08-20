import { useEffect, useRef, type CSSProperties } from "react";
import type { Atmosphere } from "../atmosphere/atmosphere.types";
import { ENVIRONMENT_MAP } from "../config/environments";
import type { EnvironmentId } from "../domain/types";

type Props = {
  environmentId: EnvironmentId;
  atmosphere: Atmosphere;
  dimmed?: boolean;
  breakMode?: boolean;
};

function TokyoLayers({ rainOn }: { rainOn: boolean }) {
  return (
    <>
      {rainOn && <div className="glass-rivulets is-visible" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
      </div>}
      <div className="street-glows" aria-hidden="true"><i /><i /><i /></div>
      <div className="cup-steam" aria-hidden="true"><i /><i /><i /></div>
    </>
  );
}

function SunsetLayers() {
  return (
    <>
      <div className="sunset-wash" aria-hidden="true" />
      <div className="drifting-clouds" aria-hidden="true"><i /><i /><i /></div>
      <div className="curtain-air curtain-air-left" aria-hidden="true" />
      <div className="curtain-air curtain-air-right" aria-hidden="true" />
      <div className="plant-shadow" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="floating-petals" aria-hidden="true"><i /><i /><i /></div>
    </>
  );
}

function MidnightLayers() {
  return (
    <>
      <div className="monitor-bloom" aria-hidden="true" />
      <div className="desk-lamp-bloom" aria-hidden="true" />
      <div className="city-twinkles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="sleep-breath" aria-hidden="true"><i /><i /></div>
    </>
  );
}

const RAIN_PARTICLES = Array.from({ length: 18 }, (_, index) => index);
const SNOW_PARTICLES = Array.from({ length: 16 }, (_, index) => index);
const STAR_PARTICLES = Array.from({ length: 14 }, (_, index) => index);

function AtmosphereLayers({ environmentId, atmosphere }: { environmentId: EnvironmentId; atmosphere: Atmosphere }) {
  const rainOn = atmosphere.weather === "rain" || atmosphere.weather === "storm";
  const cloudsOn = atmosphere.weather === "cloudy" || rainOn || atmosphere.weather === "snow";
  const starsOn = atmosphere.weather === "clear" && atmosphere.timeOfDay === "night";

  return (
    <div className={`atmosphere-field atmosphere-field-${environmentId}`} aria-hidden="true">
      <div className="scene-time-grade" />
      <div className="weather-exterior">
        <div className="weather-sky-grade" />
        {cloudsOn && <div className="weather-cloudbank"><i /><i /><i /></div>}
        {starsOn && <div className="weather-stars">
          {STAR_PARTICLES.map((index) => <i key={index} style={{ "--particle": index } as CSSProperties} />)}
        </div>}
        {rainOn && <div className="weather-rainfall">
          {RAIN_PARTICLES.map((index) => <i key={index} style={{ "--particle": index } as CSSProperties} />)}
        </div>}
        {atmosphere.weather === "snow" && <div className="weather-snowfall">
          {SNOW_PARTICLES.map((index) => <i key={index} style={{ "--particle": index } as CSSProperties} />)}
        </div>}
        {atmosphere.weather === "fog" && <div className="weather-fog-layer"><i /><i /><i /></div>}
        {rainOn && <div className="weather-wet-sheen" />}
        {atmosphere.weather === "storm" && <div className="weather-lightning" />}
      </div>
      <div className="weather-interior-response" />
    </div>
  );
}

export default function EnvironmentScene({ environmentId, atmosphere, dimmed = false, breakMode = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const definition = ENVIRONMENT_MAP[environmentId];
  const rainOn = atmosphere.weather === "rain" || atmosphere.weather === "storm";
  const timeArt = definition.timeArt[atmosphere.timeOfDay];

  useEffect(() => {
    const node = rootRef.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      node.style.setProperty("--scene-x", `${x * -8}px`);
      node.style.setProperty("--scene-y", `${y * -5}px`);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`environment-scene scene-${environmentId} weather-${atmosphere.weather} time-${atmosphere.timeOfDay} ${dimmed ? "is-dimmed" : ""} ${breakMode ? "is-break" : ""}`}
      style={{
        "--scene-image": `url(${definition.baseAsset})`,
        "--scene-time-art": `url(${timeArt})`,
      } as CSSProperties}
      data-scene-asset={definition.baseAsset}
      data-time-art={timeArt}
      data-weather={atmosphere.weather}
      data-time-of-day={atmosphere.timeOfDay}
      data-atmosphere-source={atmosphere.source}
      aria-hidden="true"
    >
      <div className="scene-backplate" />
      <div className="scene-time-art" />
      {environmentId === "tokyo" && <TokyoLayers rainOn={rainOn} />}
      {environmentId === "sunset" && <SunsetLayers />}
      {environmentId === "midnight" && <MidnightLayers />}
      <AtmosphereLayers environmentId={environmentId} atmosphere={atmosphere} />
      <div className="scene-vignette" />
      <div className="scene-grain" />
    </div>
  );
}
