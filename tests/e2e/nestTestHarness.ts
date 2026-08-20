import type { Page } from "@playwright/test";

export type ExternalHarness = {
  setWeather: (input: { code: number; temperature?: number; isDay?: boolean }) => void;
};

export type NestTestState = {
  permission: "prompt" | "granted" | "denied";
  geolocation: "success" | "denied" | "unavailable" | "timeout";
  geoCalls: number;
  playersCreated: number;
  playersDestroyed: number;
};

export async function installExternalHarness(
  page: Page,
  options: { permission?: "prompt" | "granted" | "denied"; geolocation?: "success" | "denied" | "unavailable" | "timeout" } = {},
): Promise<ExternalHarness> {
  const initial = {
    permission: options.permission ?? "prompt",
    geolocation: options.geolocation ?? "success",
  };
  await page.addInitScript((setup) => {
    type PlayerEvents = {
      onReady: (event: { target: FakePlayer }) => void;
      onError: (event: { data: number }) => void;
      onAutoplayBlocked: () => void;
    };
    type PlayerOptions = { videoId?: string; playerVars: Record<string, string | number>; events: PlayerEvents };

    const state: NestTestState = { ...setup, geoCalls: 0, playersCreated: 0, playersDestroyed: 0 };
    const testWindow = window as typeof window & { __nestTest: NestTestState };
    testWindow.__nestTest = state;

    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: async () => ({ state: testWindow.__nestTest.permission }) },
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback, error: PositionErrorCallback) => {
          testWindow.__nestTest.geoCalls += 1;
          const mode = testWindow.__nestTest.geolocation;
          if (mode === "success") {
            success({
              coords: { latitude: 33.57, longitude: -7.59, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) },
              timestamp: Date.now(),
              toJSON: () => ({}),
            });
            return;
          }
          const code = mode === "denied" ? 1 : mode === "timeout" ? 3 : 2;
          error({ code, message: mode, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
        },
      },
    });

    class FakePlayer {
      private marker: HTMLElement;
      private destroyed = false;
      constructor(element: HTMLElement, options: PlayerOptions) {
        testWindow.__nestTest.playersCreated += 1;
        this.marker = document.createElement("div");
        this.marker.setAttribute("data-fake-youtube", options.videoId ?? String(options.playerVars.list ?? "playlist"));
        element.append(this.marker);
        queueMicrotask(() => {
          if (options.videoId === "AAAAAAAAAAA") options.events.onError({ data: 5 });
          else if (options.videoId === "BBBBBBBBBBB") options.events.onError({ data: 150 });
          else options.events.onReady({ target: this });
        });
      }
      destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        testWindow.__nestTest.playersDestroyed += 1;
        this.marker.remove();
      }
      playVideo() {}
      pauseVideo() {}
      setVolume(_volume: number) {}
    }

    (window as typeof window & { YT: { Player: typeof FakePlayer } }).YT = { Player: FakePlayer };
  }, initial);

  let current = { code: 61, temperature: 18, isDay: true };
  await page.route("**/api.open-meteo.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ current: { temperature_2m: current.temperature, weather_code: current.code, is_day: current.isDay ? 1 : 0 } }),
    });
  });

  return {
    setWeather: ({ code, temperature = current.temperature, isDay = current.isDay }) => {
      current = { code, temperature, isDay };
    },
  };
}

export async function enterNest(page: Page, place = "Rainy Tokyo Café"): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(place) }).click();
  await page.getByLabel("Set up focus timer").waitFor();
}

export async function startFocus(page: Page, task = "Test the quiet room", duration = "25"): Promise<void> {
  await page.getByPlaceholder("One thing. Keep it simple.").fill(task);
  await page.getByRole("button", { name: duration, exact: true }).click();
  await page.getByRole("button", { name: /Begin focus/ }).click();
  await page.getByLabel("Current focus timer").waitFor();
}

export async function readPersistedNestData(page: Page): Promise<unknown> {
  return page.evaluate(async () => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open("nest-local", 1);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction("app", "readonly").objectStore("app").get("state");
      read.onsuccess = () => { db.close(); resolve(read.result as unknown); };
      read.onerror = () => { db.close(); reject(read.error); };
    };
    request.onerror = () => reject(request.error);
  }));
}
