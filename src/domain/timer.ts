import type { ActiveSession, EnvironmentId } from "./types";

export function createSession(input: {
  task: string;
  environmentId: EnvironmentId;
  sourceId: string | null;
  durationMinutes: number | null;
  now: number;
}): ActiveSession {
  return {
    task: input.task.trim(),
    environmentId: input.environmentId,
    sourceId: input.sourceId,
    durationMinutes: input.durationMinutes,
    startedAt: input.now,
    accumulatedMs: 0,
    runningSince: input.now,
  };
}

export function elapsedMs(session: ActiveSession, now: number): number {
  return session.accumulatedMs + (session.runningSince === null ? 0 : Math.max(0, now - session.runningSince));
}

export function remainingSeconds(session: ActiveSession, now: number): number {
  const elapsedSeconds = Math.floor(elapsedMs(session, now) / 1_000);
  if (session.durationMinutes === null) return elapsedSeconds;
  return Math.max(0, Math.ceil(session.durationMinutes * 60 - elapsedMs(session, now) / 1_000));
}

export function isSessionFinished(session: ActiveSession, now: number): boolean {
  return session.durationMinutes !== null && elapsedMs(session, now) >= session.durationMinutes * 60_000;
}

export function toggleSession(session: ActiveSession, now: number): ActiveSession {
  if (session.runningSince === null) return { ...session, runningSince: now };
  return {
    ...session,
    accumulatedMs: session.accumulatedMs + Math.max(0, now - session.runningSince),
    runningSince: null,
  };
}

export function addMinutes(session: ActiveSession, minutes: number): ActiveSession {
  if (session.durationMinutes === null) return session;
  return { ...session, durationMinutes: session.durationMinutes + minutes };
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3_600);
  const minutes = Math.floor((safe % 3_600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
