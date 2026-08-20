import { addMinutes, createSession, elapsedMs, toggleSession } from "../domain/timer";
import type { NestData, NestSettings, SavedSpace, YouTubeSource } from "../domain/types";

export function patchSettings(data: NestData, patch: Partial<NestSettings>): NestData {
  return { ...data, settings: { ...data.settings, ...patch } };
}

export function saveSource(data: NestData, source: YouTubeSource): NestData {
  return {
    ...data,
    sources: [source, ...data.sources],
    settings: { ...data.settings, sourceId: source.id },
  };
}

export function removeSource(data: NestData, sourceId: string): NestData {
  return {
    ...data,
    sources: data.sources.filter((source) => source.id !== sourceId),
    spaces: data.spaces.map((space) => space.sourceId === sourceId ? { ...space, sourceId: null } : space),
    settings: { ...data.settings, sourceId: data.settings.sourceId === sourceId ? null : data.settings.sourceId },
  };
}

export function startFocus(data: NestData, now: number): NestData {
  if (!data.settings.currentTask.trim()) return data;
  return {
    ...data,
    activeSession: createSession({
      task: data.settings.currentTask,
      environmentId: data.settings.environmentId,
      sourceId: data.settings.sourceId,
      durationMinutes: data.settings.durationMinutes,
      now,
    }),
    breakState: null,
  };
}

export function toggleFocus(data: NestData, now: number): NestData {
  if (!data.activeSession) return data;
  return { ...data, activeSession: toggleSession(data.activeSession, now) };
}

export function extendFocus(data: NestData, minutes: number): NestData {
  if (!data.activeSession) return data;
  return { ...data, activeSession: addMinutes(data.activeSession, minutes) };
}

export function pauseFocusAtEnd(data: NestData): NestData {
  const active = data.activeSession;
  if (!active || active.durationMinutes === null) return data;
  return {
    ...data,
    activeSession: {
      ...active,
      accumulatedMs: active.durationMinutes * 60_000,
      runningSince: null,
    },
  };
}

export function completeFocus(data: NestData, now: number, note: string): NestData {
  const active = data.activeSession;
  if (!active) return data;
  const minutes = Math.max(1, Math.round(elapsedMs(active, now) / 60_000));
  return {
    ...data,
    activeSession: null,
    history: [{
      id: crypto.randomUUID(),
      task: active.task,
      environmentId: active.environmentId,
      sourceId: active.sourceId,
      startedAt: new Date(active.startedAt).toISOString(),
      endedAt: new Date(now).toISOString(),
      minutes,
      note: note.trim() || undefined,
    }, ...data.history],
    settings: { ...data.settings, currentTask: "" },
  };
}

export function startBreak(data: NestData, now: number, durationMinutes = 10): NestData {
  return { ...data, breakState: { startedAt: now, endsAt: now + durationMinutes * 60_000 } };
}

export function saveSpace(data: NestData, space: SavedSpace): NestData {
  return { ...data, spaces: [space, ...data.spaces] };
}

export function removeSpace(data: NestData, spaceId: string): NestData {
  return { ...data, spaces: data.spaces.filter((space) => space.id !== spaceId) };
}

export function applySpace(data: NestData, space: SavedSpace): NestData {
  return {
    ...data,
    settings: {
      ...data.settings,
      environmentId: space.environmentId,
      sourceId: space.sourceId,
      durationMinutes: space.durationMinutes,
      layout: space.layout,
      ambient: { ...space.ambient },
      hasEntered: true,
    },
  };
}
