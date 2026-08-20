// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNow } from "./useNow";

describe("useNow", () => {
  afterEach(() => vi.useRealTimers());

  it("updates the room clock once per second by default and cleans up", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T10:00:00Z"));
    const { result, unmount } = renderHook(() => useNow());
    const initial = result.current;

    act(() => vi.advanceTimersByTime(999));
    expect(result.current).toBe(initial);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(initial + 1_000);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
