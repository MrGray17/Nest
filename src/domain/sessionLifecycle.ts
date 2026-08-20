import type { ActiveSession, NestData } from "./types";
import { elapsedMs } from "./timer";

/**
 * Persist a recovery-safe snapshot of a running session.
 *
 * Nest deliberately restores recovered sessions in a paused state. That keeps
 * time spent with the app closed from being counted as focus time while still
 * preserving every millisecond that was observed before the checkpoint.
 */
export function checkpointActiveSession(session: ActiveSession, now: number): ActiveSession {
  if (session.runningSince === null) return session;
  return {
    ...session,
    accumulatedMs: elapsedMs(session, now),
    runningSince: null,
  };
}

/**
 * Normalize persisted active sessions for recovery.
 *
 * Older V2 snapshots may still contain a non-null runningSince. Their
 * accumulatedMs already represents the last persisted checkpoint, so resuming
 * from "now - runningSince" would incorrectly count time spent away from Nest.
 * Treat every recovered running session as paused at its last known checkpoint.
 */
export function restoreActiveSession(session: ActiveSession, _now: number): ActiveSession {
  if (session.runningSince === null) return session;
  const accumulatedMs = session.durationMinutes === null
    ? session.accumulatedMs
    : Math.min(session.accumulatedMs, session.durationMinutes * 60_000);
  return { ...session, accumulatedMs, runningSince: null };
}

export function checkpointNestData(data: NestData, now: number): NestData {
  if (!data.activeSession || data.activeSession.runningSince === null) return data;
  return { ...data, activeSession: checkpointActiveSession(data.activeSession, now) };
}
