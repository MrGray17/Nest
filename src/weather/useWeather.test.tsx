// @vitest-environment jsdom
import { StrictMode, type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLocalWeather, queryWeatherPermission } from "./weatherService";
import { useWeather } from "./useWeather";
import type { CurrentWeather } from "./weather.types";

vi.mock("./weatherService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./weatherService")>();
  return { ...actual, getLocalWeather: vi.fn(), queryWeatherPermission: vi.fn() };
});

const weather: CurrentWeather = { temperature: 18, weatherCode: 61, isDay: true, kind: "rain", observedAt: 0 };
const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;

async function flush() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

describe("useWeather refresh lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.mocked(queryWeatherPermission).mockResolvedValue("granted");
    vi.mocked(getLocalWeather).mockResolvedValue(weather);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });

  afterEach(() => vi.useRealTimers());

  it("fetches once under StrictMode and refreshes at the stale interval", async () => {
    const hook = renderHook(() => useWeather(true), { wrapper });
    await flush();
    expect(getLocalWeather).toHaveBeenCalledTimes(1);
    expect(hook.result.current.state.status).toBe("ready");

    await act(async () => { await vi.advanceTimersByTimeAsync(29 * 60_000); });
    expect(getLocalWeather).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(getLocalWeather).toHaveBeenCalledTimes(2);
    hook.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refreshes when a stale app becomes visible without request loops", async () => {
    renderHook(() => useWeather(true));
    await flush();
    vi.setSystemTime(31 * 60_000);
    document.dispatchEvent(new Event("visibilitychange"));
    await flush();
    expect(getLocalWeather).toHaveBeenCalledTimes(2);
    await flush();
    expect(getLocalWeather).toHaveBeenCalledTimes(2);
  });

  it("ignores an older request that resolves after a newer refresh", async () => {
    let resolveFirst!: (value: typeof weather) => void;
    let resolveSecond!: (value: typeof weather) => void;
    vi.mocked(getLocalWeather)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    const hook = renderHook(() => useWeather(true));
    await flush();
    void hook.result.current.refresh();
    await flush();
    resolveSecond({ ...weather, kind: "clear", temperature: 25, observedAt: 10 });
    await flush();
    resolveFirst(weather);
    await flush();
    expect(hook.result.current.state).toMatchObject({ status: "ready", data: { kind: "clear", temperature: 25 } });
  });
});
