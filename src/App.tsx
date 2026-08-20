import { ChevronDown, Heart, History, Maximize } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtmosphere } from "./atmosphere/AtmosphereProvider";
import ArrivalScreen from "./components/ArrivalScreen";
import BreakObject from "./components/BreakObject";
import ControlDock from "./components/ControlDock";
import EnvironmentScene from "./components/EnvironmentScene";
import MediaObject from "./components/MediaObject";
import SessionEndOverlay from "./components/SessionEndOverlay";
import TimerObject from "./components/TimerObject";
import WeatherControl from "./components/WeatherControl";
import AmbientPanel from "./components/panels/AmbientPanel";
import HistoryPanel from "./components/panels/HistoryPanel";
import MusicPanel from "./components/panels/MusicPanel";
import SpacesPanel from "./components/panels/SpacesPanel";
import { ENVIRONMENT_MAP } from "./config/environments";
import { isSessionFinished } from "./domain/timer";
import type { AmbientChannelId, AmbientMix, EnvironmentId, NestData, SavedSpace } from "./domain/types";
import { useAmbientEngine } from "./hooks/useAmbientEngine";
import { useIdleControls } from "./hooks/useIdleControls";
import { useNestData } from "./hooks/useNestData";
import { useNow } from "./hooks/useNow";
import {
  applySpace,
  completeFocus,
  extendFocus,
  patchSettings,
  pauseFocusAtEnd,
  removeSource,
  removeSpace,
  saveSource,
  saveSpace,
  startBreak,
  startFocus,
  toggleFocus,
} from "./state/nestMutations";

type PanelId = "music" | "mixer" | "history" | "spaces" | null;
type UpdateData = (recipe: (current: NestData) => NestData) => void;

export default function App() {
  const store = useNestData();
  if (!store.data) {
    return (
      <main className="loading-nest">
        <span className="loading-mark">N</span>
        <p>{store.error ?? "Opening the room…"}</p>
      </main>
    );
  }
  return <NestExperience data={store.data} error={store.error} update={store.update} />;
}

function NestExperience({ data, error, update }: { data: NestData; error: string | null; update: UpdateData }) {
  const [panel, setPanel] = useState<PanelId>(null);
  const [ending, setEnding] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const breakReadyRef = useRef<HTMLButtonElement>(null);
  const postSessionFocusRefs = useMemo(() => [taskInputRef, breakReadyRef], []);
  const now = useNow();
  const { atmosphere } = useAtmosphere();
  const settings = data.settings;
  const environment = ENVIRONMENT_MAP[settings.environmentId];
  const active = data.activeSession;
  const currentSource = data.sources.find((source) => source.id === settings.sourceId) ?? null;
  const idle = useIdleControls(Boolean(active || data.breakState) && !panel && !ending);
  const audibleMix = useMemo(() => {
    if (!ending) return settings.ambient;
    return Object.fromEntries(Object.entries(settings.ambient).map(([channel, value]) => [channel, Math.round(value * 0.35)])) as AmbientMix;
  }, [ending, settings.ambient]);
  const ambient = useAmbientEngine(settings.environmentId, audibleMix);

  useEffect(() => {
    if (!active || active.runningSince === null || !isSessionFinished(active, now)) return;
    update(pauseFocusAtEnd);
    setEnding(true);
  }, [active, now, update]);

  useEffect(() => {
    if (data.breakState && data.breakState.endsAt <= now) update((current) => ({ ...current, breakState: null }));
  }, [data.breakState, now, update]);

  useEffect(() => {
    if (!whisper) return;
    const id = window.setTimeout(() => setWhisper(null), 3_200);
    return () => window.clearTimeout(id);
  }, [whisper]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.matches("button, a, input, textarea, select, [contenteditable='true'], [role='button']");
      if (event.key === "Escape") setPanel(null);
      if (interactive) return;
      if (event.code === "Space" && active && !ending) {
        event.preventDefault();
        update((current) => toggleFocus(current, Date.now()));
      }
      if (event.key.toLowerCase() === "m") setPanel("music");
      if (event.key.toLowerCase() === "s") setPanel("mixer");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, ending, update]);

  const setEnvironment = (environmentId: EnvironmentId) => update((current) => patchSettings(current, { environmentId }));
  const openPanel = (next: Exclude<PanelId, null>) => setPanel((current) => current === next ? null : next);

  const beginFocus = () => {
    if (!settings.currentTask.trim()) return;
    void ambient.start();
    update((current) => startFocus(current, Date.now()));
  };

  const openSessionEnd = () => {
    const finishTime = Date.now();
    update((current) => current.activeSession && current.activeSession.runningSince !== null ? toggleFocus(current, finishTime) : current);
    setEnding(true);
    setPanel(null);
  };

  const finishSession = (note: string, takeBreak: boolean) => {
    const finishedAt = Date.now();
    update((current) => {
      const completed = completeFocus(current, finishedAt, note);
      return takeBreak ? startBreak(completed, finishedAt) : completed;
    });
    setEnding(false);
    setWhisper(takeBreak ? "The room will wait ☕" : "Session tucked away ✨");
  };

  const extendEndingSession = () => {
    const resumedAt = Date.now();
    update((current) => toggleFocus(extendFocus(current, 15), resumedAt));
    setEnding(false);
  };

  const saveCurrentSpace = (name: string) => {
    const space: SavedSpace = {
      id: crypto.randomUUID(),
      name,
      environmentId: settings.environmentId,
      sourceId: settings.sourceId,
      durationMinutes: settings.durationMinutes,
      layout: settings.layout,
      ambient: { ...settings.ambient },
      createdAt: new Date().toISOString(),
    };
    update((current) => saveSpace(current, space));
    setWhisper(`${name} saved ♥`);
  };

  const applySavedSpace = (space: SavedSpace) => {
    update((current) => applySpace(current, space));
    setPanel(null);
    setWhisper(space.environmentId === "tokyo" ? "Back to the café 🌧️" : `Welcome back to ${space.name} 🌱`);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setWhisper("Fullscreen isn't available in this browser.");
    }
  };

  if (!settings.hasEntered && !active) {
    return (
      <ArrivalScreen
        selected={settings.environmentId}
        onSelect={setEnvironment}
        onEnter={(environmentId) => update((current) => patchSettings(current, { environmentId, hasEntered: true }))}
      />
    );
  }

  const ambientSummary = environment.channels
    .filter((channel) => settings.ambient[channel] > 0)
    .map((channel) => `${channel[0].toUpperCase()}${channel.slice(1)} ${settings.ambient[channel]}%`)
    .join(" · ") || "Room quiet";

  return (
    <main className={`nest-room room-${settings.environmentId} layout-${settings.layout} ${idle ? "controls-idle" : ""} ${active ? "is-focusing" : ""} ${data.breakState ? "is-breaking" : ""}`}>
      <EnvironmentScene environmentId={settings.environmentId} atmosphere={atmosphere} dimmed={settings.layout === "watch" || ending} breakMode={Boolean(data.breakState)} />
      <div className="room-ui">
        <header className="room-header auto-hide-control">
          <button type="button" className="room-wordmark" onClick={() => update((current) => patchSettings(current, { hasEntered: false }))} aria-label="Choose another place">
            <span>N</span><strong>Nest</strong>
          </button>
          <button type="button" className="place-switcher" onClick={() => update((current) => patchSettings(current, { hasEntered: false }))}>
            <span>{environment.icon}</span>{environment.name}<ChevronDown size={14} />
          </button>
          <div className="header-actions">
            <WeatherControl variant="room" />
            <button type="button" onClick={() => openPanel("spaces")} aria-label="Saved spaces" title="Saved spaces"><Heart size={16} /></button>
            <button type="button" onClick={() => openPanel("history")} aria-label="History" title="History"><History size={16} /></button>
            <button type="button" onClick={() => void toggleFullscreen()} aria-label="Fullscreen" title="Fullscreen"><Maximize size={16} /></button>
          </div>
        </header>

        <section className="room-title auto-hide-control">
          <span>{environment.eyebrow}</span>
          <h1>{environment.shortName}</h1>
        </section>

        {data.breakState ? (
          <BreakObject state={data.breakState} now={now} onReady={() => update((current) => ({ ...current, breakState: null }))} readyButtonRef={breakReadyRef} />
        ) : (
          <section className="focus-stage" aria-label="Focus room">
            <MediaObject source={currentSource} volume={ending ? Math.min(25, settings.youtubeVolume) : settings.youtubeVolume} onOpenMusic={() => openPanel("music")} />
            <TimerObject
              settings={settings}
              active={active}
              now={now}
              compact={settings.layout !== "focus"}
              onTaskChange={(currentTask) => update((current) => patchSettings(current, { currentTask }))}
              onDurationChange={(durationMinutes) => update((current) => patchSettings(current, { durationMinutes }))}
              onCustomDurationChange={(customDurationMinutes) => update((current) => patchSettings(current, { customDurationMinutes, durationMinutes: customDurationMinutes }))}
              onBegin={beginFocus}
              onToggle={() => update((current) => toggleFocus(current, Date.now()))}
              onExtend={() => update((current) => extendFocus(current, 10))}
              onFinish={openSessionEnd}
              taskInputRef={taskInputRef}
            />
          </section>
        )}

        <div className="auto-hide-control">
          <ControlDock
            layout={settings.layout}
            sourceName={currentSource?.name ?? null}
            ambientSummary={ambientSummary}
            onLayoutChange={(layout) => update((current) => patchSettings(current, { layout }))}
            onOpenMusic={() => openPanel("music")}
            onOpenMixer={() => openPanel("mixer")}
            onOpenSpaces={() => openPanel("spaces")}
            onFullscreen={() => void toggleFullscreen()}
          />
        </div>
      </div>

      {panel === "music" && <MusicPanel sources={data.sources} selectedId={settings.sourceId} onSave={(source) => update((current) => saveSource(current, source))} onSelect={(sourceId) => { update((current) => patchSettings(current, { sourceId })); setPanel(null); }} onRemove={(sourceId) => update((current) => removeSource(current, sourceId))} onClose={() => setPanel(null)} />}
      {panel === "mixer" && <AmbientPanel environmentId={settings.environmentId} mix={settings.ambient} youtubeVolume={settings.youtubeVolume} audioState={ambient.state} onStartAudio={() => void ambient.start()} onMixChange={(channel: AmbientChannelId, value) => update((current) => patchSettings(current, { ambient: { ...current.settings.ambient, [channel]: value } }))} onYouTubeVolumeChange={(youtubeVolume) => update((current) => patchSettings(current, { youtubeVolume }))} onClose={() => setPanel(null)} />}
      {panel === "history" && <HistoryPanel history={data.history} sources={data.sources} onClose={() => setPanel(null)} />}
      {panel === "spaces" && <SpacesPanel spaces={data.spaces} sources={data.sources} onSave={saveCurrentSpace} onApply={applySavedSpace} onRemove={(spaceId) => update((current) => removeSpace(current, spaceId))} onClose={() => setPanel(null)} />}
      {ending && active && <SessionEndOverlay session={active} now={now} onExtend={extendEndingSession} onBreak={(note) => finishSession(note, true)} onFinish={(note) => finishSession(note, false)} fallbackFocusRefs={postSessionFocusRefs} />}
      {whisper && <div className="room-whisper" role="status">{whisper}</div>}
      {error && <div className="save-error" role="status">{error}</div>}
    </main>
  );
}
