import { describe, expect, it } from "vitest";
import { addMinutes, createSession, elapsedMs, formatClock, isSessionFinished, remainingSeconds, toggleSession } from "./timer";

describe("timer", () => {
  const session = createSession({ task: "Atomic tests", environmentId: "tokyo", sourceId: null, durationMinutes: 45, now: 1_000 });

  it("uses wall-clock timestamps without interval drift", () => {
    expect(elapsedMs(session, 61_000)).toBe(60_000);
    expect(remainingSeconds(session, 61_000)).toBe(44 * 60);
  });

  it("accumulates paused time and resumes cleanly", () => {
    const paused = toggleSession(session, 31_000);
    expect(elapsedMs(paused, 90_000)).toBe(30_000);
    const resumed = toggleSession(paused, 90_000);
    expect(elapsedMs(resumed, 120_000)).toBe(60_000);
  });

  it("supports multiple pause and resume cycles", () => {
    const firstPause = toggleSession(session, 11_000);
    const firstResume = toggleSession(firstPause, 21_000);
    const secondPause = toggleSession(firstResume, 51_000);
    const secondResume = toggleSession(secondPause, 101_000);
    expect(elapsedMs(secondResume, 111_000)).toBe(50_000);
  });

  it("supports open-ended and extended sessions", () => {
    const open = { ...session, durationMinutes: null };
    expect(remainingSeconds(open, 121_000)).toBe(120);
    expect(addMinutes(open, 10)).toBe(open);
    expect(addMinutes(session, 10).durationMinutes).toBe(55);
  });

  it("detects completion and formats long clocks", () => {
    expect(isSessionFinished(session, 45 * 60_000 + 1_000)).toBe(true);
    expect(formatClock(3_661)).toBe("1:01:01");
  });

  it("handles completion boundaries without negative display values", () => {
    const finishAt = session.startedAt + 45 * 60_000;
    expect(isSessionFinished(session, finishAt - 1)).toBe(false);
    expect(isSessionFinished(session, finishAt)).toBe(true);
    expect(remainingSeconds(session, finishAt - 1)).toBe(1);
    expect(remainingSeconds(session, finishAt)).toBe(0);
    expect(remainingSeconds(session, finishAt + 60_000)).toBe(0);
    expect(formatClock(-500)).toBe("00:00");
  });

  it("counts open-ended and long sessions upward", () => {
    const open = createSession({ task: "Long work", environmentId: "midnight", sourceId: null, durationMinutes: null, now: 0 });
    expect(remainingSeconds(open, 10 * 60 * 60_000 + 999)).toBe(36_000);
    expect(formatClock(remainingSeconds(open, 10 * 60 * 60_000))).toBe("10:00:00");
  });
});
