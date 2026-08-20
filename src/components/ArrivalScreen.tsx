import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAtmosphere } from "../atmosphere/AtmosphereProvider";
import { ENVIRONMENTS } from "../config/environments";
import type { EnvironmentId } from "../domain/types";
import EnvironmentScene from "./EnvironmentScene";
import WeatherControl from "./WeatherControl";

type Props = {
  selected: EnvironmentId;
  onSelect: (id: EnvironmentId) => void;
  onEnter: (id: EnvironmentId) => void;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return { copy: "Still awake?", icon: "🌙" };
  if (hour < 12) return { copy: "Good morning", icon: "🌤️" };
  if (hour < 18) return { copy: "Good afternoon", icon: "☀️" };
  if (hour < 21) return { copy: "Good evening", icon: "🌇" };
  return { copy: "Good evening", icon: "🌙" };
}

export default function ArrivalScreen({ selected, onSelect, onEnter }: Props) {
  const { atmosphere } = useAtmosphere();
  const [entering, setEntering] = useState<EnvironmentId | null>(null);
  const enterTimer = useRef<number | null>(null);
  const hello = greeting();

  useEffect(() => () => {
    if (enterTimer.current !== null) window.clearTimeout(enterTimer.current);
  }, []);

  const enter = (environmentId: EnvironmentId) => {
    if (entering) return;
    setEntering(environmentId);
    onSelect(environmentId);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onEnter(environmentId);
      return;
    }

    enterTimer.current = window.setTimeout(() => onEnter(environmentId), 680);
  };

  const chromeStyle = {
    opacity: entering ? 0 : 1,
    transform: entering ? "translateY(-6px)" : "translateY(0)",
    transition: "opacity .42s ease, transform .42s ease",
  } as const;

  return (
    <main
      className="arrival-shell"
      aria-busy={Boolean(entering)}
      data-environment={selected}
      data-weather={atmosphere.weather}
      data-time-of-day={atmosphere.timeOfDay}
      data-atmosphere-source={atmosphere.source}
    >
      <EnvironmentScene
        key={selected}
        environmentId={selected}
        atmosphere={atmosphere}
        dimmed={!entering}
      />
      <div className="arrival-grain" aria-hidden="true" />
      <header className="arrival-header" style={chromeStyle}>
        <span className="arrival-mark">N</span>
        <strong>Nest</strong>
        <WeatherControl variant="arrival" />
      </header>

      <section className="arrival-intro" style={chromeStyle}>
        <p>{hello.copy} <span aria-hidden="true">{hello.icon}</span></p>
        <h1>Where do you want to be?</h1>
      </section>

      <section className="place-doors" aria-label="Choose an environment" style={{ ...chromeStyle, transitionDelay: entering ? "0s" : ".05s" }}>
        {ENVIRONMENTS.map((environment) => {
          const timeArt = environment.timeArt[atmosphere.timeOfDay];
          return (
            <button
              type="button"
              key={environment.id}
              className={`place-door ${selected === environment.id ? "is-selected" : ""}`}
              style={{
                "--door-image": `url(${environment.baseAsset})`,
                "--door-time-art": `url(${timeArt})`,
                "--door-accent": environment.accent,
              } as React.CSSProperties}
              data-scene-asset={environment.baseAsset}
              data-time-art={timeArt}
              onFocus={() => !entering && onSelect(environment.id)}
              onPointerEnter={() => !entering && onSelect(environment.id)}
              onClick={() => enter(environment.id)}
              disabled={Boolean(entering)}
            >
              <span className="door-time-art" aria-hidden="true" />
              <span className="door-copy">
                <small>{environment.eyebrow}</small>
                <strong>{environment.name}</strong>
                <em>{environment.description}</em>
              </span>
              <span className="door-enter" aria-hidden="true">Enter <ArrowRight size={16} /></span>
            </button>
          );
        })}
      </section>

      <footer className="arrival-footer" style={chromeStyle}>
        <span>Pick a place. Put your music on. Choose one thing.</span>
      </footer>
    </main>
  );
}
