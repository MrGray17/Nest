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
  });

  it("mounts only the particles required by the active atmosphere", () => {
    const { container, rerender } = render(<EnvironmentScene environmentId="tokyo" atmosphere={base} />);
    expect(container.querySelectorAll(".weather-rainfall i")).toHaveLength(0);
    expect(container.querySelectorAll(".weather-snowfall i")).toHaveLength(0);
    expect(container.querySelectorAll(".rain-plane i")).toHaveLength(0);

    rerender(<EnvironmentScene environmentId="tokyo" atmosphere={{ ...base, weather: "rain" }} />);
    expect(container.querySelectorAll(".weather-rainfall i")).toHaveLength(22);
    expect(container.querySelectorAll(".rain-plane i")).toHaveLength(18);
    expect(container.querySelectorAll(".weather-snowfall i")).toHaveLength(0);

    rerender(<EnvironmentScene environmentId="tokyo" atmosphere={{ ...base, weather: "snow" }} />);
    expect(container.querySelectorAll(".weather-snowfall i")).toHaveLength(18);
    expect(container.querySelectorAll(".weather-rainfall i")).toHaveLength(0);
    expect(container.querySelectorAll(".rain-plane i")).toHaveLength(0);
  });
});
