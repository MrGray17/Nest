import { expect, test } from "@playwright/test";
import { enterNest, installExternalHarness, readPersistedNestData } from "./nestTestHarness";

test("YouTube video, playlist, and live URLs leave loading deterministically", async ({ page }) => {
  await installExternalHarness(page);
  await enterNest(page);
  await page.getByLabel("YouTube player").getByRole("button", { name: "Add music" }).click();
  await page.getByLabel("Name").fill("Quiet video");
  await page.getByLabel("YouTube link").fill("https://youtube.com/watch?v=dQw4w9WgXcQ");
  await page.getByRole("button", { name: /Save & use/ }).click();
  await expect(page.locator(".youtube-player")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByText("Warming up YouTube…")).toBeHidden();

  await page.getByLabel("Name").fill("Quiet playlist");
  await page.getByLabel("YouTube link").fill("https://youtube.com/playlist?list=PL1234567890");
  await page.getByRole("button", { name: /Save & use/ }).click();
  await expect(page.locator(".youtube-player")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("[data-fake-youtube='PL1234567890']")).toBeAttached();

  await page.getByLabel("Name").fill("Live radio");
  await page.getByLabel("YouTube link").fill("https://youtube.com/live/CCCCCCCCCCC");
  await page.getByRole("button", { name: /Save & use/ }).click();
  await expect(page.locator(".youtube-player")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("[data-fake-youtube='CCCCCCCCCCC']")).toBeAttached();
  await expect(page.getByText("Warming up YouTube…")).toBeHidden();
});

test("YouTube exposes a friendly recoverable error instead of warming forever", async ({ page }) => {
  await installExternalHarness(page);
  await enterNest(page);
  await page.getByLabel("YouTube player").getByRole("button", { name: "Add music" }).click();
  await page.getByLabel("YouTube link").fill("https://youtube.com/watch?v=AAAAAAAAAAA");
  await page.getByRole("button", { name: /Save & use/ }).click();
  await expect(page.getByRole("alert")).toContainText("couldn't play");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByText("Warming up YouTube…")).toBeHidden();
});

test("explains location first, applies outside rain to arrival and room, and preserves manual override", async ({ page }) => {
  await installExternalHarness(page, { permission: "prompt", geolocation: "success" });
  await page.goto("/");
  const arrival = page.locator(".arrival-shell");
  await expect(page.getByRole("heading", { name: "Where do you want to be?" })).toBeVisible();
  await expect(arrival).toHaveAttribute("data-environment", "tokyo");

  await page.getByRole("button", { name: "Weather and local time" }).click();
  await expect(page.getByText("Match Nest to the weather outside")).toBeVisible();
  await expect(page.getByText(/used only to retrieve local weather/)).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __nestTest: { geoCalls: number } }).__nestTest.geoCalls)).toBe(0);

  await page.getByRole("button", { name: "Allow location" }).click();
  await expect(page.getByRole("button", { name: "Weather and local time" })).toContainText("18° · Rain");
  await expect(arrival).toHaveAttribute("data-weather", "rain");
  await expect(arrival).toHaveAttribute("data-atmosphere-source", "outside");

  await page.getByRole("button", { name: /Summer Sunset/ }).hover();
  await expect(arrival).toHaveAttribute("data-environment", "sunset");
  await expect(arrival).toHaveAttribute("data-weather", "rain");

  await page.getByRole("button", { name: /Rainy Tokyo Café/ }).click();
  await expect(page.locator(".environment-scene.scene-tokyo")).toHaveAttribute("data-weather", "rain");
  await expect(page.locator(".environment-scene")).toHaveAttribute("data-atmosphere-source", "outside");

  await page.getByRole("button", { name: "Weather and local time" }).click();
  await page.getByRole("button", { name: /Choose a mood/ }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator(".environment-scene")).toHaveAttribute("data-weather", "clear");
  await expect(page.locator(".environment-scene")).toHaveAttribute("data-atmosphere-source", "manual");
});

test("location denial remains usable and manual weather persists", async ({ page }) => {
  await installExternalHarness(page, { permission: "prompt", geolocation: "denied" });
  await page.goto("/");
  await page.getByRole("button", { name: "Weather and local time" }).click();
  await page.getByRole("button", { name: "Allow location" }).click();
  await expect(page.getByText(/Location is blocked/)).toBeVisible();
  await page.getByRole("button", { name: /Choose a mood/ }).click();
  await page.getByRole("button", { name: "Snow", exact: true }).click();
  await page.getByRole("button", { name: /Late-Night Coding/ }).click();
  await expect(page.locator(".environment-scene.scene-midnight")).toHaveAttribute("data-weather", "snow");
  await expect.poll(async () => {
    const saved = await readPersistedNestData(page) as { settings?: { environmentId?: string } } | null;
    return saved?.settings?.environmentId ?? null;
  }).toBe("midnight");
  await page.reload();
  await expect(page.locator(".environment-scene.scene-midnight")).toHaveAttribute("data-weather", "snow");
});

test("all six outside conditions update atmosphere without changing place identity", async ({ page }) => {
  const harness = await installExternalHarness(page, { permission: "prompt", geolocation: "success" });
  await enterNest(page);
  await page.getByRole("button", { name: "Weather and local time" }).click();
  await page.getByRole("button", { name: "Allow location" }).click();
  const conditions = [
    { code: 0, kind: "clear" },
    { code: 2, kind: "cloudy" },
    { code: 45, kind: "fog" },
    { code: 61, kind: "rain" },
    { code: 75, kind: "snow" },
    { code: 96, kind: "storm" },
  ];
  for (const condition of conditions) {
    harness.setWeather({ code: condition.code });
    await page.getByRole("button", { name: /Refresh weather/ }).click();
    await expect(page.locator(".environment-scene.scene-tokyo")).toHaveAttribute("data-weather", condition.kind);
  }
});
