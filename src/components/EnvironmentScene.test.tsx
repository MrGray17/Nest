// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Atmosphere } from "../atmosphere/atmosphere.types";
import EnvironmentScene from "./EnvironmentScene";

const base: Atmosphere = { weather: "clear", isDay: true, timeOfDay: "day", temperature: 20, source: "outside" };

describe("EnvironmentScene atmosphere contract", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  it.each([
    ["tokyo", { ...base, weather: "rain", timeOfDay: "day" }, "scene-tokyo"],
    ["tokyo", { ...base, weather: "rain", timeOfDay: "night", isDay: false }, "scene-tokyo"],
    ["midnight", { ...base, weather: "clear", timeOfDay: "night", isDay: false }, "scene-midnight"],
    ["sunset", { ...base, weather: "clear", timeOfDay: "sunset" }, "scene-sunset"],
    ["sunset", { ...base, weather: "cloudy" }, "scene-sunset"],
    ["midnight", { ...base, weather: "snow" }, "scene-midnight"],
    ["tokyo", { ...base, weather: "storm" }, "scene-tokyo"],
  ] as const)("keeps %s identity while applying %s", (environmentId, atmosphere, sceneClass) => {
    const { container } = render(<EnvironmentScene environmentId={environmentId} atmosphere={atmosphere} />);
    const scene = container.querySelector(".environment-scene");
    expect(scene).toHaveClass(sceneClass);
    expect(scene).toHaveAttribute("data-weather", atmosphere.weather);
    expect(scene).toHaveAttribute("data-time-of-day", atmosphere.timeOfDay);
    expect(container.querySelector(".weather-exterior")).toBeInTheDocument();
  });

  it.each([
    ["tokyo", "dawn", /tokyo-dawn\.svg$/],
    ["tokyo", "day", /tokyo-day\.svg$/],
    ["sunset", "sunset", /summer-sunset\.svg$/],
    ["sunset", "night", /summer-night\.svg$/],
    ["midnight", "day", /coding-day\.svg$/],
    ["midnight", "night", /coding-night\.svg$/],
  ] as const)("selects authored %s %s art", (environmentId, timeOfDay, expected) => {
    const atmosphere = { ...base, timeOfDay, isDay: timeOfDay !== "night" } as Atmosphere;
    const { container } = render(<EnvironmentScene environmentId={environmentId} atmosphere={atmosphere} />);
    const scene = container.querySelector(".environment-scene");
    expect(scene?.getAttribute("data-time-art")).toMatch(expected);
    expect(container.querySelector(".scene-time-art")).toBeInTheDocument();
  });

  it("mounts weather particles only inside the exterior zone", () => {
    const { container, rerender } = render(<EnvironmentScene environmentId="tokyo" atmosphere={base} />);
    expect(container.querySelectorAll(".weather-rainfall i")).toHaveLength(0);
    expect(container.querySelectorAll(".weather-snowfall i")).toHaveLength(0);

    rerender(<EnvironmentScene environmentId="tokyo" atmosphere={{ ...base, weather: "rain" }} />);
    const rain = container.querySelector(".weather-rainfall");
    expect(rain).toBeInTheDocument();
    expect(rain?.closest(".weather-exterior")).toBeInTheDocument();
    expect(container.querySelectorAll(".weather-rainfall i")).toHaveLength(18);
    expect(container.querySelectorAll(".weather-snowfall i")).toHaveLength(0);

    rerender(<EnvironmentScene environmentId="tokyo" atmosphere={{ ...base, weather: "snow" }} />);
    const snow = container.querySelector(".weather-snowfall");
    expect(snow).toBeInTheDocument();
    expect(snow?.closest(".weather-exterior")).toBeInTheDocument();
    expect(container.querySelectorAll(".weather-snowfall i")).toHaveLength(16);
    expect(container.querySelectorAll(".weather-rainfall i")).toHaveLength(0);
  });

  it("keeps interior weather response particle-free", () => {
    const { container } = render(<EnvironmentScene environmentId="midnight" atmosphere={{ ...base, weather: "fog" }} />);
    const interior = container.querySelector(".weather-interior-response");
    expect(interior).toBeInTheDocument();
    expect(interior?.querySelectorAll("i")).toHaveLength(0);
    expect(container.querySelector(".weather-fog-layer")?.closest(".weather-exterior")).toBeInTheDocument();
  });
});
