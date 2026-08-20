import { expect, test, type Page } from "@playwright/test";
import { enterNest, installExternalHarness, readPersistedNestData, startFocus, type NestTestState } from "./nestTestHarness";

async function playerCounts(page: Page) {
  return page.evaluate(() => {
    const state = (window as typeof window & { __nestTest: NestTestState }).__nestTest;
    return { created: state.playersCreated, destroyed: state.playersDestroyed };
  });
}

test("reduced motion removes continuous decorative movement and keeps a short entry fade", async ({ page }) => {
  await installExternalHarness(page);
  await enterNest(page);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

  const decorative = page.locator(".street-glows i").first();
  await expect(decorative).toBeAttached();
  const motion = await decorative.evaluate((element) => {
    const style = getComputedStyle(element);
    return { duration: style.animationDuration, iterations: style.animationIterationCount };
  });
  expect(motion.iterations).toBe("1");
  expect(motion.duration).toBe("1e-06s");
  await expect(page.locator(".nest-room")).toHaveCSS("animation-name", "reduced-entry-fade");
});

test("production service worker restores the shell and local data offline", async ({ page, context }) => {
  await installExternalHarness(page);
  await enterNest(page, "Late-Night Coding");
  await page.getByPlaceholder("One thing. Keep it simple.").fill("Available offline");
  await expect.poll(async () => {
    const saved = await readPersistedNestData(page) as { settings?: { currentTask?: string } } | null;
    return saved?.settings?.currentTask ?? null;
  }).toBe("Available offline");

  // Nest registers through `virtual:pwa-register`, so there is intentionally no
  // standalone /registerSW.js script tag to assert against. The browser-level
  // registration and actual offline reload are the behavior that matters.
  await expect.poll(async () => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), {
    message: "the production PWA should register its generated service worker",
    timeout: 10_000,
  }).toBeGreaterThan(0);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole("heading", { name: "Late Night" })).toBeVisible();
    await expect(page.getByPlaceholder("One thing. Keep it simple.")).toHaveValue("Available offline");
    await expect(page.getByLabel("Set up focus timer")).toBeVisible();
  } finally {
    await context.setOffline(false);
    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    });
    await page.close();
    await context.close();
  }
});

test("rapid scene and YouTube switching releases obsolete players", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installExternalHarness(page);
  await enterNest(page);

  for (const place of ["Summer Sunset", "Late-Night Coding", "Rainy Tokyo Caf", "Summer Sunset", "Rainy Tokyo Caf"]) {
    await page.getByRole("button", { name: "Choose another place" }).click();
    await page.getByRole("button", { name: new RegExp(place) }).click();
    await expect(page.locator(".environment-scene")).toHaveCount(1);
  }

  await page.getByLabel("YouTube player").getByRole("button", { name: "Add music" }).click();
  for (const [name, url] of [
    ["First", "https://youtube.com/watch?v=dQw4w9WgXcQ"],
    ["Second", "https://youtube.com/watch?v=CCCCCCCCCCC"],
    ["Playlist", "https://youtube.com/playlist?list=PL1234567890"],
  ]) {
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("YouTube link").fill(url);
    await page.getByRole("button", { name: /Save & use/ }).click();
    await expect(page.locator(".youtube-player")).toHaveAttribute("aria-busy", "false");
  }
  await expect.poll(() => playerCounts(page)).toEqual({ created: 3, destroyed: 2 });
  await page.getByRole("button", { name: "Close YouTube" }).click();
  await page.getByRole("button", { name: "Choose another place" }).click();
  await expect.poll(() => playerCounts(page)).toEqual({ created: 3, destroyed: 3 });
  expect(pageErrors).toEqual([]);
});

test("rapid pause and resume remains coherent and cannot duplicate completion", async ({ page }) => {
  await installExternalHarness(page);
  await enterNest(page);
  await startFocus(page, "Hostile repeated input");
  const timer = page.getByLabel("Current focus timer");
  for (let index = 0; index < 10; index += 1) {
    await timer.getByRole("button", { name: "Pause" }).click();
    await timer.getByRole("button", { name: "Resume" }).click();
  }
  await timer.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("dialog", { name: "Focus session complete" }).getByRole("button", { name: /Finish/ }).click();
  await expect.poll(async () => {
    const saved = await readPersistedNestData(page) as { history?: unknown[]; activeSession?: unknown } | null;
    return { history: saved?.history?.length ?? 0, active: Boolean(saved?.activeSession) };
  }).toEqual({ history: 1, active: false });
});

test("external failures and malformed media never make the room unusable", async ({ page }) => {
  await page.route("https://www.youtube.com/iframe_api", (route) => route.abort("failed"));
  await enterNest(page);
  await page.getByLabel("YouTube player").getByRole("button", { name: "Add music" }).click();
  await page.getByLabel("YouTube link").fill("not a youtube url");
  await page.getByRole("button", { name: /Save & use/ }).click();
  await expect(page.getByRole("alert")).toContainText("valid YouTube");

  await page.getByLabel("YouTube link").fill("https://youtube.com/watch?v=dQw4w9WgXcQ");
  await page.getByRole("button", { name: /Save & use/ }).click();
  await expect(page.getByRole("alert")).toContainText(/couldn't open|couldn't start|couldn't reach/i);
  await expect(page.getByText("Warming up YouTube…")).toBeHidden();
  await page.getByRole("button", { name: "Close YouTube" }).click();
  await expect(page.getByLabel("Set up focus timer")).toBeVisible();
});

test("weather network and audio restrictions degrade to usable controls", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
  });
  await installExternalHarness(page, { permission: "prompt", geolocation: "success" });
  await page.unroute("**/api.open-meteo.com/**");
  await page.route("**/api.open-meteo.com/**", (route) => route.abort("failed"));
  await enterNest(page);

  await page.getByRole("button", { name: "Weather and local time" }).click();
  await page.getByRole("button", { name: "Allow location" }).click();
  await expect(page.getByRole("alert")).toContainText(/weather|network|reach/i);
  await page.getByRole("button", { name: /Choose a mood/ }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator(".environment-scene")).toHaveAttribute("data-weather", "clear");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Rain 34%/ }).click();
  await page.getByRole("button", { name: "Enable room ambience" }).click();
  await expect(page.getByRole("button", { name: "Try ambience again" })).toBeVisible();
  await expect(page.getByLabel("Set up focus timer")).toBeVisible();
});
