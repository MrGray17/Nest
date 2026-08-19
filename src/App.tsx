import { useEffect, useMemo, useRef, useState } from "react";
import MomentLayer, { type AmbientMoment } from "./MomentLayer";
import PlaceScene, { type PlaceId, type Season } from "./PlaceScene";

type Session = {
  id: string;
  task: string;
  place: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  note?: string;
};

type ActiveSession = {
  task: string;
  place: PlaceId;
  durationMinutes: number | null;
  startedAt: number;
  accumulatedMs: number;
  runningSince: number | null;
};

type BreakState = { startedAt: number; endsAt: number };
type PlaceMeta = { name: string; detail: string; icon: string; group: "places" | "cozy" };
type GlowMap = Record<PlaceId, boolean>;

const PLACES: Record<PlaceId, PlaceMeta> = {
  cafe: { name: "Café", detail: "warm wood · window table · street glow", icon: "☕", group: "places" },
  library: { name: "Old Library", detail: "paper · firelight · quiet shelves", icon: "📚", group: "places" },
  balcony: { name: "City Balcony", detail: "open air · distant city · string lights", icon: "🌆", group: "places" },
  beach: { name: "Quiet Beach", detail: "waves · salt air · slow horizon", icon: "🌊", group: "places" },
  garden: { name: "Garden", detail: "leaves · flowers · somewhere to breathe", icon: "🌿", group: "places" },
  cabin: { name: "Forest Cabin", detail: "timber · blanket · firelight", icon: "🪵", group: "cozy" },
  attic: { name: "Attic Studio", detail: "old wood · desk lamp · rain roof", icon: "🕯️", group: "cozy" },
  train: { name: "Night Train", detail: "window seat · passing lights · nowhere urgent", icon: "🚂", group: "cozy" },
};

const PLACE_IDS = Object.keys(PLACES) as PlaceId[];
const LEGACY_PLACES: Record<string, PlaceMeta> = {
  night: { name: "2:17 AM", detail: "city glow · desk lamp", icon: "🌙", group: "cozy" },
};
const DURATIONS = [25, 45, 60] as const;
const ACTIVE_KEY = "nest.active-session.v1";
const HISTORY_KEY = "nest.history.v1";
const PLACE_KEY = "nest.place.v1";
const NOTE_KEY = "nest.scratch-note.v1";
const GLOW_KEY = "nest.glow-map.v1";
const BREAK_KEY = "nest.break.v1";

const DEFAULT_GLOWS: GlowMap = {
  cafe: true,
  library: true,
  balcony: true,
  beach: true,
  garden: true,
  cabin: true,
  attic: true,
  train: true,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isPlaceId(value: string): value is PlaceId {
  return PLACE_IDS.includes(value as PlaceId);
}

function readPlace(): PlaceId {
  const saved = readJson<string>(PLACE_KEY, "cafe");
  return isPlaceId(saved) ? saved : "cafe";
}

function readActive(): ActiveSession | null {
  const saved = readJson<ActiveSession | null>(ACTIVE_KEY, null);
  if (!saved || !isPlaceId(saved.place)) return null;
  return saved;
}

function placeMeta(id: string): PlaceMeta {
  if (isPlaceId(id)) return PLACES[id];
  return LEGACY_PLACES[id] ?? { name: "Nest", detail: "quiet focus", icon: "⌂", group: "cozy" };
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

function seasonForDate(date: Date): Season {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

function pickMoment(place: PlaceId, season: Season, hour: number): AmbientMoment {
  if (place === "library" || place === "attic" || place === "cafe") return "page-flutter";
  if (place === "balcony") return hour >= 19 || hour < 6 ? "shooting-star" : "cat";
  if (place === "beach") return hour >= 20 || hour < 6 ? "shooting-star" : "gull";
  if (place === "garden") return season === "autumn" ? "falling-leaf" : hour >= 19 ? "firefly-burst" : "falling-leaf";
  if (place === "train") return "shooting-star";
  return season === "autumn" ? "falling-leaf" : "page-flutter";
}

function App() {
  const [task, setTask] = useState("");
  const [duration, setDuration] = useState<number | null>(45);
  const [place, setPlace] = useState<PlaceId>(readPlace);
  const [active, setActive] = useState<ActiveSession | null>(readActive);
  const [history, setHistory] = useState<Session[]>(() => readJson<Session[]>(HISTORY_KEY, []));
  const [note, setNote] = useState(() => localStorage.getItem(NOTE_KEY) ?? "");
  const [glowMap, setGlowMap] = useState<GlowMap>(() => ({ ...DEFAULT_GLOWS, ...readJson<Partial<GlowMap>>(GLOW_KEY, {}) }));
  const [breakState, setBreakState] = useState<BreakState | null>(() => readJson<BreakState | null>(BREAK_KEY, null));
  const [offerBreak, setOfferBreak] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showPlaces, setShowPlaces] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showData, setShowData] = useState(false);
  const [moment, setMoment] = useState<AmbientMoment>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => localStorage.setItem(PLACE_KEY, JSON.stringify(place)), [place]);
  useEffect(() => active ? localStorage.setItem(ACTIVE_KEY, JSON.stringify(active)) : localStorage.removeItem(ACTIVE_KEY), [active]);
  useEffect(() => localStorage.setItem(HISTORY_KEY, JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem(NOTE_KEY, note), [note]);
  useEffect(() => localStorage.setItem(GLOW_KEY, JSON.stringify(glowMap)), [glowMap]);
  useEffect(() => breakState ? localStorage.setItem(BREAK_KEY, JSON.stringify(breakState)) : localStorage.removeItem(BREAK_KEY), [breakState]);

  const elapsed = active ? elapsedMs(active, now) : 0;
  const durationMs = active?.durationMinutes ? active.durationMinutes * 60_000 : null;
  const remainingSeconds = durationMs === null ? Math.floor(elapsed / 1000) : Math.ceil((durationMs - elapsed) / 1000);
  const timedSessionFinished = Boolean(active && durationMs !== null && elapsed >= durationMs);
  const breakSeconds = breakState ? Math.max(0, Math.ceil((breakState.endsAt - now) / 1000)) : 0;
  const totalMinutes = useMemo(() => history.reduce((sum, session) => sum + session.minutes, 0), [history]);
  const progressLevel = totalMinutes >= 1800 ? 4 : totalMinutes >= 900 ? 3 : totalMinutes >= 300 ? 2 : totalMinutes >= 60 ? 1 : 0;
  const season = seasonForDate(new Date(now));

  const roomPhase = useMemo(() => {
    const hour = new Date(now).getHours();
    if (hour < 7 || hour >= 21) return "night";
    if (hour < 12) return "morning";
    if (hour < 18) return "day";
    return "evening";
  }, [now]);

  const closePanels = () => {
    setShowPlaces(false);
    setShowJournal(false);
    setShowNote(false);
    setShowData(false);
  };

  const begin = () => {
    const cleanTask = task.trim();
    if (!cleanTask) return;
    const startedAt = Date.now();
    closePanels();
    setBreakState(null);
    setOfferBreak(false);
    setActive({ task: cleanTask, place, durationMinutes: duration, startedAt, accumulatedMs: 0, runningSince: startedAt });
    setTask("");
  };

  const togglePause = () => {
    if (!active) return;
    if (active.runningSince) {
      const pausedAt = Date.now();
      setActive({ ...active, accumulatedMs: active.accumulatedMs + pausedAt - active.runningSince, runningSince: null });
    } else setActive({ ...active, runningSince: Date.now() });
  };

  const addTenMinutes = () => {
    if (!active || active.durationMinutes === null) return;
    setActive({ ...active, durationMinutes: active.durationMinutes + 10 });
  };

  const finish = () => {
    if (!active) return;
    const endedAt = Date.now();
    const minutes = Math.max(1, Math.round(elapsedMs(active, endedAt) / 60_000));
    setHistory((current) => [{
      id: crypto.randomUUID(), task: active.task, place: active.place,
      startedAt: new Date(active.startedAt).toISOString(), endedAt: new Date(endedAt).toISOString(), minutes,
      note: note.trim() || undefined,
    }, ...current]);
    setActive(null);
    setOfferBreak(true);
  };

  const startBreak = () => {
    const startedAt = Date.now();
    setBreakState({ startedAt, endsAt: startedAt + 5 * 60_000 });
    setOfferBreak(false);
    closePanels();
  };

  useEffect(() => {
    if (timedSessionFinished && active?.runningSince) {
      const id = window.setTimeout(finish, 300);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [timedSessionFinished]);

  useEffect(() => {
    if (breakState && breakSeconds <= 0) setBreakState(null);
  }, [breakSeconds, breakState]);

  useEffect(() => {
    const schedule = () => window.setTimeout(() => {
      if (Math.random() < 0.58) {
        setMoment(pickMoment(place, season, new Date().getHours()));
        window.setTimeout(() => setMoment(null), 8500);
      }
      timer = schedule();
    }, 70_000 + Math.random() * 80_000);
    let timer = schedule();
    return () => window.clearTimeout(timer);
  }, [place, season]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === "Escape") closePanels();
      if (typing) return;
      if (event.code === "Space" && active) { event.preventDefault(); togglePause(); }
      if (event.key.toLowerCase() === "j" && !active) { closePanels(); setShowJournal(true); }
      if (event.key.toLowerCase() === "n") { closePanels(); setShowNote(true); }
      if (event.key.toLowerCase() === "p" && !active) { closePanels(); setShowPlaces(true); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  const exportData = () => {
    const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), history, note, place, glowMap }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { history?: Session[]; note?: string; place?: string; glowMap?: Partial<GlowMap> };
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (typeof parsed.note === "string") setNote(parsed.note);
      if (parsed.place && isPlaceId(parsed.place)) setPlace(parsed.place);
      if (parsed.glowMap) setGlowMap((current) => ({ ...current, ...parsed.glowMap }));
      setShowData(false);
    } catch {
      window.alert("Nest couldn't read that backup file.");
    }
  };

  const currentPlace = PLACES[place];
  const weeklyMinutes = history.filter((session) => Date.now() - new Date(session.startedAt).getTime() < 7 * 86_400_000).reduce((sum, session) => sum + session.minutes, 0);

  return (
    <main className={`nest phase-${roomPhase} place-${place} season-${season} ${active ? "is-focusing" : ""} ${breakState ? "is-breaking" : ""}`}>
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <button className="wordmark" onClick={closePanels} aria-label="Nest home"><span className="nest-mark">⌂</span> Nest</button>
        <div className="top-actions">
          <button className="quiet-button" onClick={() => { closePanels(); setShowNote(true); }}>Note</button>
          <button className="quiet-button" onClick={() => { closePanels(); setShowPlaces(true); }}>{currentPlace.icon} {currentPlace.name}</button>
          <button className="quiet-button" onClick={() => { closePanels(); setShowJournal(true); }}>Journal</button>
          <button className="quiet-button quiet-icon" onClick={() => { closePanels(); setShowData(true); }} aria-label="Nest data and shortcuts">•••</button>
        </div>
      </header>

      <section className="room" aria-label={`${currentPlace.name} focus room`}>
        <PlaceScene
          place={place}
          season={season}
          glowOn={glowMap[place]}
          progressLevel={progressLevel}
          onToggleGlow={() => setGlowMap((current) => ({ ...current, [place]: !current[place] }))}
        />
        <MomentLayer moment={moment} place={place} />

        {!active && !breakState && !showJournal && !showNote && !showData && (
          <section className="start-card">
            <p className="eyebrow">{currentPlace.detail}</p>
            <h1>{greetingForHour(new Date(now).getHours())}</h1>
            <p className="prompt">What are we working on?</p>
            <input value={task} onChange={(event) => setTask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && begin()} placeholder="One thing. Keep it simple." autoFocus />
            <div className="duration-row" aria-label="Focus duration">
              {DURATIONS.map((minutes) => <button key={minutes} className={duration === minutes ? "selected" : ""} onClick={() => setDuration(minutes)}>{minutes} min</button>)}
              <button className={duration === null ? "selected" : ""} onClick={() => setDuration(null)}>open-ended</button>
            </div>
            <button className="begin-button" disabled={!task.trim()} onClick={begin}>Begin <span>→</span></button>
          </section>
        )}

        {active && (
          <section className="focus-card">
            <p className="eyebrow">{active.runningSince ? "quiet focus" : "paused"}</p>
            <div className="timer">{formatClock(Math.abs(remainingSeconds))}</div>
            <h2>{active.task}</h2>
            <p className="place-caption">{placeMeta(active.place).icon} {placeMeta(active.place).name}</p>
            <div className="focus-controls">
              <button onClick={togglePause}>{active.runningSince ? "Pause" : "Resume"}</button>
              {active.durationMinutes !== null && <button onClick={addTenMinutes}>+10 min</button>}
              <button onClick={() => setShowNote((value) => !value)}>Note</button>
              <button onClick={finish}>Finish</button>
            </div>
          </section>
        )}

        {breakState && (
          <section className="break-card">
            <p className="eyebrow">nothing to optimize</p>
            <h2>Tea?</h2>
            <div className="break-timer">{formatClock(breakSeconds)}</div>
            <p>Look away from the screen. The room will wait.</p>
            <button onClick={() => setBreakState(null)}>I'm ready</button>
          </section>
        )}

        {offerBreak && !active && !breakState && !showJournal && !showNote && !showData && (
          <div className="break-offer"><span>Session tucked away.</span><button onClick={startBreak}>Take five</button><button onClick={() => setOfferBreak(false)}>Not now</button></div>
        )}

        {showNote && (
          <section className="note-card panel-card">
            <div className="panel-heading"><div><p className="eyebrow">scrap of paper</p><h2>One thought.</h2></div><button onClick={() => setShowNote(false)}>×</button></div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catch the thought before it leaves…" autoFocus />
            <p className="panel-footnote">Saved on this device. Press Esc to put it away.</p>
          </section>
        )}

        {showJournal && !active && (
          <section className="journal-card panel-card">
            <div className="panel-heading"><div><p className="eyebrow">your notebook</p><h2>Recent pages</h2></div><button onClick={() => setShowJournal(false)}>×</button></div>
            <div className="journal-summary"><div><strong>{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m</strong><span>this week</span></div><div><strong>{history.length}</strong><span>sessions kept</span></div><div><strong>{Math.floor(totalMinutes / 60)}h</strong><span>in this room</span></div></div>
            {history.length === 0 ? <p className="empty-state">Your first finished session will appear here. No streaks. No guilt.</p> : (
              <div className="session-list">{history.slice(0, 10).map((session) => <article key={session.id}><div><strong>{session.task}</strong><span>{new Date(session.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {placeMeta(session.place).name}{session.note ? ` · “${session.note.slice(0, 42)}${session.note.length > 42 ? "…" : ""}”` : ""}</span></div><b>{session.minutes}m</b></article>)}</div>
            )}
          </section>
        )}

        {showPlaces && !active && (
          <aside className="places-panel">
            <div className="places-heading"><div><p className="eyebrow">places</p><strong>Where today?</strong></div><button onClick={() => setShowPlaces(false)}>×</button></div>
            <span className="place-group-label">Everyday</span>
            {PLACE_IDS.filter((id) => PLACES[id].group === "places").map((id) => { const item = PLACES[id]; return <button key={id} className={place === id ? "active" : ""} onClick={() => { setPlace(id); setShowPlaces(false); }}><span>{item.icon}</span><div><strong>{item.name}</strong><small>{item.detail}</small></div></button>; })}
            <span className="place-group-label">Deep cozy</span>
            {PLACE_IDS.filter((id) => PLACES[id].group === "cozy").map((id) => { const item = PLACES[id]; return <button key={id} className={place === id ? "active" : ""} onClick={() => { setPlace(id); setShowPlaces(false); }}><span>{item.icon}</span><div><strong>{item.name}</strong><small>{item.detail}</small></div></button>; })}
          </aside>
        )}

        {showData && !active && (
          <section className="data-card panel-card">
            <div className="panel-heading"><div><p className="eyebrow">your nest</p><h2>Local & yours.</h2></div><button onClick={() => setShowData(false)}>×</button></div>
            <p>Your sessions, note, room choice, and little room changes stay on this device.</p>
            <div className="data-actions"><button onClick={exportData}>Export backup</button><button onClick={() => importRef.current?.click()}>Import backup</button></div>
            <input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); }} />
            <div className="shortcut-list"><span><kbd>Space</kbd> pause / resume</span><span><kbd>P</kbd> places</span><span><kbd>N</kbd> note</span><span><kbd>J</kbd> journal</span><span><kbd>Esc</kbd> close</span></div>
          </section>
        )}
      </section>

      <footer><span>{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span>{season} · room memory {progressLevel}/4</span><span>Your quiet little place to work.</span></footer>
    </main>
  );
}

export default App;
