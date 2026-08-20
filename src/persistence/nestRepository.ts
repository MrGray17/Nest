import { checkpointNestData, restoreActiveSession } from "../domain/sessionLifecycle";
import { DEFAULT_DATA, type ActiveSession, type AmbientMix, type BreakState, type EnvironmentId, type LayoutMode, type NestData, type SavedSpace, type SessionRecord, type YouTubeSource } from "../domain/types";
import { parseYouTubeUrl } from "../domain/youtube";

const DB_NAME = "nest-local";
const DB_VERSION = 1;
const STORE = "app";
const ROOT_KEY = "state";

type LegacySession = {
  id?: string;
  task?: string;
  place?: string;
  startedAt?: string;
  endedAt?: string;
  minutes?: number;
  note?: string;
};

function cloneDefaults(): NestData {
  return structuredClone(DEFAULT_DATA);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function environmentId(value: unknown): EnvironmentId {
  return value === "sunset" || value === "midnight" ? value : "tokyo";
}

function layoutMode(value: unknown): LayoutMode {
  return value === "immersive" || value === "watch" ? value : "focus";
}

function volume(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function dateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function duration(value: unknown, fallback: number | null): number | null {
  if (value === null) return null;
  return finiteNumber(value) && value >= 1 && value <= 480 ? Math.round(value) : fallback;
}

function normalizeSource(value: unknown): YouTubeSource | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || typeof value.url !== "string" || !dateString(value.createdAt)) return null;
  const parsed = parseYouTubeUrl(value.url);
  if (!parsed) return null;
  return {
    id: value.id,
    name: value.name,
    url: parsed.canonicalUrl,
    videoId: parsed.videoId,
    playlistId: parsed.playlistId,
    createdAt: value.createdAt,
  };
}

function normalizeSpace(value: unknown, fallbackMix: AmbientMix): SavedSpace | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || !dateString(value.createdAt)) return null;
  const ambient = isRecord(value.ambient) ? value.ambient : {};
  return {
    id: value.id,
    name: value.name,
    environmentId: environmentId(value.environmentId),
    sourceId: typeof value.sourceId === "string" ? value.sourceId : null,
    durationMinutes: duration(value.durationMinutes, 45),
    layout: layoutMode(value.layout),
    ambient: {
      rain: volume(ambient.rain, fallbackMix.rain),
      cafe: volume(ambient.cafe, fallbackMix.cafe),
      wind: volume(ambient.wind, fallbackMix.wind),
      city: volume(ambient.city, fallbackMix.city),
    },
    createdAt: value.createdAt,
  };
}

function normalizeHistoryRecord(value: unknown): SessionRecord | null {
  if (!isRecord(value)
    || typeof value.id !== "string"
    || typeof value.task !== "string"
    || !dateString(value.startedAt)
    || !dateString(value.endedAt)
    || !finiteNumber(value.minutes)
    || value.minutes < 0) return null;
  return {
    id: value.id,
    task: value.task,
    environmentId: environmentId(value.environmentId),
    sourceId: typeof value.sourceId === "string" ? value.sourceId : null,
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    minutes: Math.round(value.minutes),
    note: typeof value.note === "string" ? value.note : undefined,
  };
}

function normalizeActiveSession(value: unknown, now: number): ActiveSession | null {
  if (!isRecord(value)
    || typeof value.task !== "string"
    || !finiteNumber(value.startedAt)
    || !finiteNumber(value.accumulatedMs)
    || value.accumulatedMs < 0
    || !(value.runningSince === null || finiteNumber(value.runningSince))) return null;
  const session: ActiveSession = {
    task: value.task,
    environmentId: environmentId(value.environmentId),
    sourceId: typeof value.sourceId === "string" ? value.sourceId : null,
    durationMinutes: duration(value.durationMinutes, null),
    startedAt: value.startedAt,
    accumulatedMs: value.accumulatedMs,
    runningSince: value.runningSince,
  };
  return restoreActiveSession(session, now);
}

function normalizeBreakState(value: unknown): BreakState | null {
  if (!isRecord(value) || !finiteNumber(value.startedAt) || !finiteNumber(value.endsAt) || value.endsAt < value.startedAt) return null;
  return { startedAt: value.startedAt, endsAt: value.endsAt };
}

export function normalizeNestData(value: unknown, now = Date.now()): NestData {
  const fallback = cloneDefaults();
  if (!isRecord(value) || value.version !== 2) return fallback;
  const settings = isRecord(value.settings) ? value.settings : {};
  const ambient = isRecord(settings.ambient) ? settings.ambient : {};
  const normalizedAmbient: AmbientMix = {
    rain: volume(ambient.rain, fallback.settings.ambient.rain),
    cafe: volume(ambient.cafe, fallback.settings.ambient.cafe),
    wind: volume(ambient.wind, fallback.settings.ambient.wind),
    city: volume(ambient.city, fallback.settings.ambient.city),
  };

  return {
    version: 2,
    settings: {
      ...fallback.settings,
      environmentId: environmentId(settings.environmentId),
      sourceId: typeof settings.sourceId === "string" ? settings.sourceId : null,
      durationMinutes: duration(settings.durationMinutes, fallback.settings.durationMinutes),
      customDurationMinutes: finiteNumber(settings.customDurationMinutes) ? Math.min(480, Math.max(1, Math.round(settings.customDurationMinutes))) : fallback.settings.customDurationMinutes,
      layout: layoutMode(settings.layout),
      ambient: normalizedAmbient,
      youtubeVolume: volume(settings.youtubeVolume, fallback.settings.youtubeVolume),
      currentTask: typeof settings.currentTask === "string" ? settings.currentTask : "",
      hasEntered: settings.hasEntered === true,
    },
    sources: Array.isArray(value.sources) ? value.sources.flatMap((source) => normalizeSource(source) ?? []) : [],
    spaces: Array.isArray(value.spaces) ? value.spaces.flatMap((space) => normalizeSpace(space, fallback.settings.ambient) ?? []) : [],
    history: Array.isArray(value.history) ? value.history.flatMap((session) => normalizeHistoryRecord(session) ?? []) : [],
    activeSession: normalizeActiveSession(value.activeSession, now),
    breakState: normalizeBreakState(value.breakState),
  };
}

function mapLegacyEnvironment(place: string | undefined) {
  if (place === "balcony" || place === "beach" || place === "garden") return "sunset" as const;
  if (place === "night" || place === "attic" || place === "train" || place === "library") return "midnight" as const;
  return "tokyo" as const;
}

function migrateLegacyStorage(): NestData | null {
  const legacyHistory = localStorage.getItem("nest.history.v1");
  const legacyActive = localStorage.getItem("nest.active-session.v1");
  const legacyPlace = localStorage.getItem("nest.place.v1");
  if (!legacyHistory && !legacyActive && !legacyPlace) return null;

  const next = cloneDefaults();
  try {
    const rawPlace = legacyPlace ? JSON.parse(legacyPlace) as string : "cafe";
    next.settings.environmentId = mapLegacyEnvironment(rawPlace);
  } catch {
    // Keep defaults when older data is malformed.
  }

  try {
    const history = legacyHistory ? JSON.parse(legacyHistory) as LegacySession[] : [];
    if (Array.isArray(history)) {
      next.history = history.flatMap<SessionRecord>((item) => {
        if (!item.task || !item.startedAt || !item.endedAt || typeof item.minutes !== "number") return [];
        return [{
          id: item.id ?? crypto.randomUUID(),
          task: item.task,
          environmentId: mapLegacyEnvironment(item.place),
          sourceId: null,
          startedAt: item.startedAt,
          endedAt: item.endedAt,
          minutes: item.minutes,
          note: item.note,
        }];
      });
    }
  } catch {
    // Keep a usable empty history.
  }

  try {
    const active = legacyActive ? JSON.parse(legacyActive) as {
      task?: string;
      place?: string;
      durationMinutes?: number | null;
      startedAt?: number;
      accumulatedMs?: number;
      runningSince?: number | null;
    } : null;
    if (active?.task && typeof active.startedAt === "number") {
      next.activeSession = {
        task: active.task,
        environmentId: mapLegacyEnvironment(active.place),
        sourceId: null,
        durationMinutes: active.durationMinutes ?? null,
        startedAt: active.startedAt,
        accumulatedMs: active.accumulatedMs ?? 0,
        runningSince: active.runningSince ?? null,
      };
    }
  } catch {
    // Ignore a corrupt active session.
  }

  return next;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Nest could not open local storage."));
  });
}

function readRecord(db: IDBDatabase): Promise<NestData | undefined> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(ROOT_KEY);
    request.onsuccess = () => resolve(request.result as NestData | undefined);
    request.onerror = () => reject(request.error ?? new Error("Nest could not read local storage."));
  });
}

export async function loadNestData(): Promise<NestData> {
  const db = await openDatabase();
  try {
    const saved = await readRecord(db);
    if (saved?.version === 2) return normalizeNestData(saved);
    const migrated = migrateLegacyStorage() ?? cloneDefaults();
    await saveNestData(migrated, db);
    return migrated;
  } finally {
    db.close();
  }
}

export async function saveNestData(data: NestData, existingDb?: IDBDatabase): Promise<void> {
  const db = existingDb ?? await openDatabase();
  try {
    const checkpoint = checkpointNestData(data, Date.now());
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(checkpoint, ROOT_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Nest could not save locally."));
    });
  } finally {
    if (!existingDb) db.close();
  }
}
