// @vitest-environment jsdom
import type { PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLocalWeather, queryWeatherPermission } from "../weather/weatherService";
import type { CurrentWeather } from "../weather/weather.types";
import { AtmosphereProvider, useAtmosphere } from "./AtmosphereProvider";

vi.mock("../weather/weatherService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../weather/weatherService")>();
  return { ...actual, getLocalWeather: vi.fn(), queryWeatherPermission: vi.fn() };
});

const outsideClear: CurrentWeather = { temperature: 24, weatherCode: 0, isDay: true, kind: "clear", observedAt: Date.now() };
const wrapper = ({ children }: PropsWithChildren) => <AtmosphereProvider>{children}</AtmosphereProvider>;

async function flush() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

describe("AtmosphereProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(queryWeatherPermission).mockResolvedValue("prompt");
    vi.mocked(getLocalWeather).mockReset();
  });

  it("does not trigger the browser location flow before user interaction", async () => {
    const hook = renderHook(useAtmosphere, { wrapper });
    await flush();
    expect(hook.result.current.weatherState.status).toBe("permission-required");
    expect(getLocalWeather).not.toHaveBeenCalled();
  });

  it("keeps manual rain when an older outside request finishes, then switches back explicitly", async () => {
    let resolveOutside!: (weather: CurrentWeather) => void;
    vi.mocked(getLocalWeather).mockImplementation(() => new Promise((resolve) => { resolveOutside = resolve; }));
    const hook = renderHook(useAtmosphere, { wrapper });
    await flush();

    let request!: Promise<void>;
    act(() => { request = hook.result.current.requestOutsideWeather(); });
    act(() => hook.result.current.chooseWeather("rain"));
    resolveOutside(outsideClear);
    await act(async () => { await request; });
    expect(hook.result.current.atmosphere).toMatchObject({ weather: "rain", source: "manual", temperature: null });

    act(() => hook.result.current.setMode("outside"));
    expect(hook.result.current.atmosphere).toMatchObject({ weather: "clear", source: "outside", temperature: 24 });
  });
});
