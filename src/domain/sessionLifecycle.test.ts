import { describe, expect, it } from "vitest";
import { checkpointActiveSession, restoreActiveSession } from "./sessionLifecycle";
import { createSession } from "./timer";

describe("session persistence lifecycle", () => {
  it("checkpoints running elapsed time as a paused recovery snapshot", () => {
    const session = createSession({ task: "Write", environmentId: "tokyo", sourceId: null, durationMinutes: null, now: 1_000 });
    expect(checkpointActiveSession(session, 61_000)).toMatchObject({ accumulatedMs: 60_000, runningSince: null });
  });

  it("pauses open-ended sessions at their last persisted checkpoint after reopening", () => {
    const session = {
      ...createSession({ task: "Write", environmentId: "tokyo", sourceId: null, durationMinutes: null, now: 1_000 }),
      accumulatedMs: 60_000,
      runningSince: 61_000,
    };
    expect(restoreActiveSession(session, 3_661_000)).toMatchObject({ accumulatedMs: 60_000, runningSince: null });
  });

  it("does not count time spent away for timed sessions", () => {
    const timed = {
      ...createSession({ task: "Write", environmentId: "tokyo", sourceId: null, durationMinutes: 25, now: 1_000 }),
      accumulatedMs: 60_000,
      runningSince: 61_000,
    };
    expect(restoreActiveSession(timed, 3_661_000)).toMatchObject({ accumulatedMs: 60_000, runningSince: null });
  });

  it("preserves already-paused sessions and clamps malformed over-duration recovery data", () => {
    const timed = createSession({ task: "Write", environmentId: "tokyo", sourceId: null, durationMinutes: 25, now: 1_000 });
    expect(restoreActiveSession({ ...timed, accumulatedMs: 30_000, runningSince: null }, 9_000_000)).toMatchObject({ accumulatedMs: 30_000, runningSince: null });
    expect(restoreActiveSession({ ...timed, accumulatedMs: 30 * 60_000, runningSince: 1_500_000 }, 9_000_000)).toMatchObject({ accumulatedMs: 25 * 60_000, runningSince: null });
  });
});
