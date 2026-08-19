export type PlaceId = "cafe" | "library" | "balcony" | "beach" | "garden" | "cabin" | "attic" | "train";
export type Season = "winter" | "spring" | "summer" | "autumn";

type PlaceSceneProps = {
  place: PlaceId;
  season: Season;
  glowOn: boolean;
  progressLevel: number;
  onToggleGlow: () => void;
};

function WeatherSky({ city = false }: { city?: boolean }) {
  return (
    <div className="sky weather-sky" aria-hidden="true">
      <span className="moon" />
      <span className="cloud cloud-one" />
      <span className="cloud cloud-two" />
      <span className="cloud cloud-three" />
      <span className="rain rain-one" />
      <span className="rain rain-two" />
      <span className="rain rain-three" />
      {city && <div className="city">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div>}
    </div>
  );
}

function GlowButton({ label, className, onClick }: { label: string; className: string; onClick: () => void }) {
  return <button className={`scene-hotspot ${className}`} type="button" onClick={onClick} aria-label={label} title={label}><span>✦</span></button>;
}

function Keepsakes({ level }: { level: number }) {
  return (
    <div className={`keepsakes level-${level}`} aria-hidden="true">
      {level >= 1 && <span className="keepsake keepsake-book" />}
      {level >= 2 && <span className="keepsake keepsake-postcard">⌁</span>}
      {level >= 3 && <span className="keepsake keepsake-star">✦</span>}
      {level >= 4 && <span className="keepsake keepsake-photo" />}
    </div>
  );
}

function SeasonLayer({ season }: { season: Season }) {
  return (
    <div className={`season-layer season-${season}`} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </div>
  );
}

function CafeScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-cafe ${glowOn ? "glow-on" : "glow-off"}`}>
      <div className="scene-wall-glow" aria-hidden="true" />
      <div className="window-scene" aria-hidden="true">
        <div className="window-frame"><WeatherSky city /></div><div className="window-sill" />
        <span className="curtain curtain-left" /><span className="curtain curtain-right" />
      </div>
      <div className="cafe-sign" aria-hidden="true">CAFÉ</div>
      <div className="shelf scene-shelf" aria-hidden="true"><span className="book tall" /><span className="book" /><span className="book small" /><span className="plant"><i /><b /></span></div>
      <div className="desk scene-desk" aria-hidden="true">
        <div className="lamp"><span className="shade" /><span className="stem" /><span className="base" /></div>
        <div className="mug cozy-mug">◡<span className="steam steam-one" /><span className="steam steam-two" /></div>
        <div className="notebook" /><div className="desk-edge" />
      </div>
      <GlowButton label="Toggle café lamp" className="hotspot-cafe-lamp" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
      <span className="floating-dust dust-one" aria-hidden="true" /><span className="floating-dust dust-two" aria-hidden="true" />
    </div>
  );
}

function LibraryScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-library ${glowOn ? "glow-on" : "glow-off"}`}>
      <div className="library-window"><WeatherSky /></div>
      <div className="library-shelves shelves-left" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} />)}</div>
      <div className="library-shelves shelves-right" aria-hidden="true">{Array.from({ length: 15 }, (_, i) => <i key={i} />)}</div>
      <div className="fireplace" aria-hidden="true"><div className="fire"><i /><i /><i /></div><div className="hearth" /></div>
      <div className="library-chair" aria-hidden="true"><i /></div><div className="reading-lamp" aria-hidden="true"><i /><b /></div>
      <GlowButton label="Toggle fireplace and reading light" className="hotspot-library-fire" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
      <span className="floating-dust dust-one" aria-hidden="true" /><span className="floating-dust dust-two" aria-hidden="true" /><span className="floating-dust dust-three" aria-hidden="true" />
    </div>
  );
}

function BalconyScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-balcony ${glowOn ? "glow-on" : "glow-off"}`}>
      <WeatherSky city /><div className="balcony-haze" aria-hidden="true" />
      <div className="string-lights" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
      <div className="balcony-floor" aria-hidden="true" /><div className="railing" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="balcony-table" aria-hidden="true"><span className="balcony-cup">◡<i /></span></div><div className="balcony-chair" aria-hidden="true" />
      <div className="balcony-plant plant-one" aria-hidden="true"><i /><i /><i /><i /></div><div className="balcony-plant plant-two" aria-hidden="true"><i /><i /><i /></div>
      <GlowButton label="Toggle balcony string lights" className="hotspot-balcony-lights" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
    </div>
  );
}

function BeachScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-beach ${glowOn ? "glow-on" : "glow-off"}`}>
      <WeatherSky /><div className="sea" aria-hidden="true"><span className="wave wave-one" /><span className="wave wave-two" /><span className="wave wave-three" /></div>
      <div className="sand" aria-hidden="true" /><div className="beach-umbrella" aria-hidden="true"><i /><b /></div><div className="beach-blanket" aria-hidden="true" />
      <div className="beach-lantern" aria-hidden="true">✦</div><span className="shore-foam foam-one" aria-hidden="true" /><span className="shore-foam foam-two" aria-hidden="true" />
      <GlowButton label="Toggle beach lantern" className="hotspot-beach-lantern" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
    </div>
  );
}

function GardenScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-garden ${glowOn ? "glow-on" : "glow-off"}`}>
      <WeatherSky /><div className="garden-hills" aria-hidden="true" /><div className="garden-tree tree-left" aria-hidden="true"><span /><i /><i /><i /></div><div className="garden-tree tree-right" aria-hidden="true"><span /><i /><i /><i /></div>
      <div className="garden-grass" aria-hidden="true" /><div className="garden-bench" aria-hidden="true"><i /><i /></div><div className="flower-bed" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</div>
      <div className="garden-lantern" aria-hidden="true">✦</div><span className="firefly firefly-one" aria-hidden="true" /><span className="firefly firefly-two" aria-hidden="true" /><span className="firefly firefly-three" aria-hidden="true" />
      <GlowButton label="Toggle garden lanterns" className="hotspot-garden-lantern" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
    </div>
  );
}

function CabinScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-cabin ${glowOn ? "glow-on" : "glow-off"}`}>
      <div className="cabin-wall" aria-hidden="true" /><div className="cabin-window"><WeatherSky /></div>
      <div className="cabin-fireplace" aria-hidden="true"><div className="cabin-fire"><i /><i /><i /></div></div>
      <div className="cabin-sofa" aria-hidden="true"><i /><b /></div><div className="cabin-rug" aria-hidden="true" /><div className="cabin-table" aria-hidden="true"><span>☕</span></div>
      <GlowButton label="Toggle cabin fire" className="hotspot-cabin-fire" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
    </div>
  );
}

function AtticScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-attic ${glowOn ? "glow-on" : "glow-off"}`}>
      <div className="attic-roof" aria-hidden="true" /><div className="attic-window"><WeatherSky /></div>
      <div className="attic-desk" aria-hidden="true"><div className="attic-lamp">✦</div><span className="attic-paper" /><span className="attic-cup">☕</span></div>
      <div className="attic-boxes" aria-hidden="true"><i /><i /><i /></div><div className="attic-rug" aria-hidden="true" />
      <span className="floating-dust dust-one" aria-hidden="true" /><span className="floating-dust dust-two" aria-hidden="true" />
      <GlowButton label="Toggle attic desk lamp" className="hotspot-attic-lamp" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
    </div>
  );
}

function TrainScene({ glowOn, onToggleGlow, progressLevel, season }: Omit<PlaceSceneProps, "place">) {
  return (
    <div className={`place-scene scene-train ${glowOn ? "glow-on" : "glow-off"}`}>
      <div className="train-wall" aria-hidden="true" /><div className="train-window"><WeatherSky /><div className="train-landscape"><i /><i /><i /><i /></div></div>
      <div className="train-seat seat-left" aria-hidden="true" /><div className="train-seat seat-right" aria-hidden="true" /><div className="train-table" aria-hidden="true"><span>☕</span></div>
      <div className="train-lamp" aria-hidden="true">✦</div><div className="train-reflection" aria-hidden="true" />
      <GlowButton label="Toggle train cabin light" className="hotspot-train-light" onClick={onToggleGlow} />
      <Keepsakes level={progressLevel} /><SeasonLayer season={season} />
    </div>
  );
}

export default function PlaceScene(props: PlaceSceneProps) {
  if (props.place === "library") return <LibraryScene {...props} />;
  if (props.place === "balcony") return <BalconyScene {...props} />;
  if (props.place === "beach") return <BeachScene {...props} />;
  if (props.place === "garden") return <GardenScene {...props} />;
  if (props.place === "cabin") return <CabinScene {...props} />;
  if (props.place === "attic") return <AtticScene {...props} />;
  if (props.place === "train") return <TrainScene {...props} />;
  return <CafeScene {...props} />;
}
