export type PlaceId = "cafe" | "library" | "balcony" | "beach" | "garden";

type PlaceSceneProps = {
  place: PlaceId;
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
      {city && (
        <div className="city">
          <i /><i /><i /><i /><i /><i /><i />
        </div>
      )}
    </div>
  );
}

function CafeScene() {
  return (
    <div className="place-scene scene-cafe" aria-hidden="true">
      <div className="scene-wall-glow" />
      <div className="window-scene">
        <div className="window-frame"><WeatherSky city /></div>
        <div className="window-sill" />
        <span className="curtain curtain-left" />
        <span className="curtain curtain-right" />
      </div>
      <div className="cafe-sign">CAFÉ</div>
      <div className="shelf scene-shelf">
        <span className="book tall" /><span className="book" /><span className="book small" />
        <span className="plant"><i /><b /></span>
      </div>
      <div className="desk scene-desk">
        <div className="lamp"><span className="shade" /><span className="stem" /><span className="base" /></div>
        <div className="mug cozy-mug">◡<span className="steam steam-one" /><span className="steam steam-two" /></div>
        <div className="notebook" />
        <div className="desk-edge" />
      </div>
      <span className="floating-dust dust-one" /><span className="floating-dust dust-two" />
    </div>
  );
}

function LibraryScene() {
  return (
    <div className="place-scene scene-library" aria-hidden="true">
      <div className="library-window"><WeatherSky /></div>
      <div className="library-shelves shelves-left">
        {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
      </div>
      <div className="library-shelves shelves-right">
        {Array.from({ length: 15 }, (_, index) => <i key={index} />)}
      </div>
      <div className="fireplace">
        <div className="fire"><i /><i /><i /></div>
        <div className="hearth" />
      </div>
      <div className="library-chair"><i /></div>
      <div className="reading-lamp"><i /><b /></div>
      <span className="floating-dust dust-one" /><span className="floating-dust dust-two" /><span className="floating-dust dust-three" />
    </div>
  );
}

function BalconyScene() {
  return (
    <div className="place-scene scene-balcony" aria-hidden="true">
      <WeatherSky city />
      <div className="balcony-haze" />
      <div className="string-lights">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
      <div className="balcony-floor" />
      <div className="railing"><i /><i /><i /><i /><i /><i /></div>
      <div className="balcony-table"><span className="balcony-cup">◡<i /></span></div>
      <div className="balcony-chair" />
      <div className="balcony-plant plant-one"><i /><i /><i /><i /></div>
      <div className="balcony-plant plant-two"><i /><i /><i /></div>
    </div>
  );
}

function BeachScene() {
  return (
    <div className="place-scene scene-beach" aria-hidden="true">
      <WeatherSky />
      <div className="sea">
        <span className="wave wave-one" /><span className="wave wave-two" /><span className="wave wave-three" />
      </div>
      <div className="sand" />
      <div className="beach-umbrella"><i /><b /></div>
      <div className="beach-blanket" />
      <div className="beach-glass">◡<i /></div>
      <span className="shore-foam foam-one" /><span className="shore-foam foam-two" />
    </div>
  );
}

function GardenScene() {
  return (
    <div className="place-scene scene-garden" aria-hidden="true">
      <WeatherSky />
      <div className="garden-hills" />
      <div className="garden-tree tree-left"><span /><i /><i /><i /></div>
      <div className="garden-tree tree-right"><span /><i /><i /><i /></div>
      <div className="garden-grass" />
      <div className="garden-bench"><i /><i /></div>
      <div className="flower-bed">
        {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
      </div>
      <span className="firefly firefly-one" /><span className="firefly firefly-two" /><span className="firefly firefly-three" />
    </div>
  );
}

export default function PlaceScene({ place }: PlaceSceneProps) {
  if (place === "library") return <LibraryScene />;
  if (place === "balcony") return <BalconyScene />;
  if (place === "beach") return <BeachScene />;
  if (place === "garden") return <GardenScene />;
  return <CafeScene />;
}
