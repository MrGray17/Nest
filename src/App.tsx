import { useEffect, useMemo, useState } from "react";

type PlaceId = "cafe" | "library" | "night";

type Session = {
  id: string;
  task: string;
  place: PlaceId;
  startedAt: string;
  endedAt: string;
  minutes: number;
};

type ActiveSession = {
  task: string;
  place: PlaceId;
  durationMinutes: number | null;
  startedAt: number;
  accumulatedMs: number;
  runningSince: number | null;
};

const PLACES: Record<PlaceId, { name: string; detail: string; icon: string }> = {
  cafe: { name: "Rainy Café", detail: "warm light · rain outside", icon: "☕" },
  library: { name: "Old Library", detail: "quiet shelves · fireplace", icon: "📚" },
  night: { name: "2:17 AM", detail: "city glow · desk lamp", icon: "🌙" },
};

const DURATIONS = [25, 45, 60] as const;
const ACTIVE_KEY = "nest.active-session.v1";
const HISTORY_KEY = "nest.history.v1";
const PLACE_KEY = "nest.place.v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function elapsedMs(session: ActiveSession, now: number) {
  return session.accumulatedMs + (session.runningSince ? now - session.runningSince : 0);
}

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

function App() {
  const [task, setTask] = useState("");
  const [duration, setDuration] = useState<number | null>(45);
  const [place, setPlace] = useState<PlaceId>(() => readJson<PlaceId>(PLACE_KEY, "cafe"));
  const [active, setActive] = useState<ActiveSession | null>(() => readJson<ActiveSession | null>(ACTIVE_KEY, null));
  const [history, setHistory] = useState<Session[]>(() => readJson<Session[]>(HISTORY_KEY, []));
  const [now, setNow] = useState(Date.now());
  const [showPlaces, setShowPlaces] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place));
  }, [place]);

  useEffect(() => {
    if (active) localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    else localStorage.removeItem(ACTIVE_KEY);
  }, [active]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const elapsed = active ? elapsedMs(active, now) : 0;
  const durationMs = active?.durationMinutes ? active.durationMinutes * 60_000 : null;
  const remainingSeconds = durationMs === null ? Math.floor(elapsed / 1000) : Math.ceil((durationMs - elapsed) / 1000);
  const timedSessionFinished = active && durationMs !== null && elapsed >= durationMs;

  const roomPhase = useMemo(() => {
    const hour = new Date(now).getHours();
    if (hour < 7 || hour >= 21) return "night";
    if (hour < 12) return "morning";
    if (hour < 18) return "day";
    return "evening";
  }, [now]);

  const begin = () => {
    const cleanTask = task.trim();
    if (!cleanTask) return;

    setActive({
      task: cleanTask,
      place,
      durationMinutes: duration,
      startedAt: Date.now(),
      accumulatedMs: 0,
      runningSince: Date.now(),
    });
    setTask("");
  };

  const togglePause = () => {
    if (!active) return;

    if (active.runningSince) {
      const pausedAt = Date.now();
      setActive({
        ...active,
        accumulatedMs: active.accumulatedMs + pausedAt - active.runningSince,
        runningSince: null,
      });
    } else {
      setActive({ ...active, runningSince: Date.now() });
    }
  };

  const addTenMinutes = () => {
    if (!active || active.durationMinutes === null) return;
    setActive({ ...active, durationMinutes: active.durationMinutes + 10 });
  };

  const finish = () => {
    if (!active) return;
    const endedAt = Date.now();
    const totalMs = elapsedMs(active, endedAt);
    const minutes = Math.max(1, Math.round(totalMs / 60_000));

    setHistory((current) => [
      {
        id: crypto.randomUUID(),
        task: active.task,
        place: active.place,
        startedAt: new Date(active.startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        minutes,
      },
      ...current,
    ]);
    setActive(null);
  };

  useEffect(() => {
    if (timedSessionFinished && active?.runningSince) {
      const id = window.setTimeout(finish, 300);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [timedSessionFinished]);

  const currentPlace = PLACES[place];

  return (
    <main className={`nest phase-${roomPhase} place-${place}`}>
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <button className="wordmark" onClick={() => setShowJournal(false)} aria-label="Nest home">
          <span className="nest-mark">⌂</span> Nest
        </button>
        <div className="top-actions">
          <button className="quiet-button" onClick={() => setShowPlaces((value) => !value)}>
            {currentPlace.icon} {currentPlace.name}
          </button>
          <button className="quiet-button" onClick={() => setShowJournal((value) => !value)}>
            Journal
          </button>
        </div>
      </header>

      <section className="room" aria-label={`${currentPlace.name} focus room`}>
        <div className="wall-glow" aria-hidden="true" />
        <div className="window-scene" aria-hidden="true">
          <div className="window-frame">
            <div className="sky">
              <span className="moon" />
              <span className="cloud cloud-one" />
              <span className="cloud cloud-two" />
              <span className="rain rain-one" />
              <span className="rain rain-two" />
              <span className="rain rain-three" />
              <div className="city">
                <i /><i /><i /><i /><i />
              </div>
            </div>
          </div>
          <div className="window-sill" />
        </div>

        <div className="shelf" aria-hidden="true">
          <span className="book tall" /><span className="book" /><span className="book small" />
          <span className="plant"><i /><b /></span>
        </div>

        <div className="desk" aria-hidden="true">
          <div className="lamp"><span className="shade" /><span className="stem" /><span className="base" /></div>
          <div className="mug">◡</div>
          <div className="notebook" />
          <div className="desk-edge" />
        </div>

        {!active && !showJournal && (
          <section className="start-card">
            <p className="eyebrow">{currentPlace.detail}</p>
            <h1>{greetingForHour(new Date(now).getHours())}</h1>
            <p className="prompt">What are we working on?</p>
            <input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && begin()}
              placeholder="One thing. Keep it simple."
              autoFocus
            />

            <div className="duration-row" aria-label="Focus duration">
              {DURATIONS.map((minutes) => (
                <button
                  key={minutes}
                  className={duration === minutes ? "selected" : ""}
                  onClick={() => setDuration(minutes)}
                >
                  {minutes} min
                </button>
              ))}
              <button className={duration === null ? "selected" : ""} onClick={() => setDuration(null)}>
                open-ended
              </button>
            </div>

            <button className="begin-button" disabled={!task.trim()} onClick={begin}>
              Begin
              <span>→</span>
            </button>
          </section>
        )}

        {active && (
          <section className="focus-card">
            <p className="eyebrow">{active.runningSince ? "quiet focus" : "paused"}</p>
            <div className="timer">{formatClock(Math.abs(remainingSeconds))}</div>
            <h2>{active.task}</h2>
            <p className="place-caption">{PLACES[active.place].icon} {PLACES[active.place].name}</p>
            <div className="focus-controls">
              <button onClick={togglePause}>{active.runningSince ? "Pause" : "Resume"}</button>
              {active.durationMinutes !== null && <button onClick={addTenMinutes}>+10 min</button>}
              <button onClick={finish}>Finish</button>
            </div>
          </section>
        )}

        {showJournal && !active && (
          <section className="journal-card">
            <div className="journal-heading">
              <div>
                <p className="eyebrow">your notebook</p>
                <h2>Recent sessions</h2>
              </div>
              <button className="close-button" onClick={() => setShowJournal(false)}>×</button>
            </div>
            {history.length === 0 ? (
              <p className="empty-state">Your first finished session will appear here. No streaks. No guilt.</p>
            ) : (
              <div className="session-list">
                {history.slice(0, 8).map((session) => (
                  <article key={session.id}>
                    <div>
                      <strong>{session.task}</strong>
                      <span>{new Date(session.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {PLACES[session.place].name}</span>
                    </div>
                    <b>{session.minutes}m</b>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {showPlaces && (
          <aside className="places-panel">
            <p className="eyebrow">places</p>
            {Object.entries(PLACES).map(([id, item]) => (
              <button
                key={id}
                className={place === id ? "active" : ""}
                onClick={() => {
                  setPlace(id as PlaceId);
                  setShowPlaces(false);
                }}
              >
                <span>{item.icon}</span>
                <div><strong>{item.name}</strong><small>{item.detail}</small></div>
              </button>
            ))}
          </aside>
        )}
      </section>

      <footer>
        <span>{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span>Your quiet little place to work.</span>
      </footer>
    </main>
  );
}

export default App;
