import { expect, test } from "@playwright/test";
import { enterNest, installExternalHarness } from "./nestTestHarness";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-08-20T10:00:00") });
  await installExternalHarness(page);
  await page.addInitScript(() => {
    const state = { active: false, requests: 0, exits: 0 };
    Object.defineProperty(window, "__nestFullscreenTest", { value: state, configurable: true });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => state.active ? document.documentElement : null,
    });
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: async () => { state.active = true; state.requests += 1; },
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: async () => { state.active = false; state.exits += 1; },
    });
  });
});

test("every primary room button causes a visible or persisted state change", async ({ page }) => {
  await enterNest(page);

  const weather = page.getByRole("button", { name: "Weather and local time" });
  await weather.click();
  await expect(page.getByRole("complementary", { name: "Weather settings" })).toBeVisible();
  await page.getByRole("button", { name: "Close weather settings" }).click();
  await expect(page.getByRole("complementary", { name: "Weather settings" })).toBeHidden();

  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByRole("dialog", { name: "History" })).toBeVisible();
  await page.getByRole("button", { name: "Close History" }).click();

  await page.getByRole("button", { name: "Saved spaces" }).first().click();
  await expect(page.getByRole("dialog", { name: "Saved spaces" })).toBeVisible();
  await page.getByLabel("Saved space name").fill("Morning room");
  await page.getByRole("button", { name: /Save this room/ }).click();
  await expect(page.getByRole("dialog", { name: "Saved spaces" })).toContainText("Morning room");
  await page.getByRole("button", { name: "Close Saved spaces" }).click();

  const dock = page.locator(".room-dock");
  await dock.locator(".dock-command").nth(0).click();
  await expect(page.getByRole("dialog", { name: "YouTube" })).toBeVisible();
  await page.getByRole("button", { name: "Close YouTube" }).click();

  await dock.locator(".dock-command").nth(1).click();
  await expect(page.getByRole("dialog", { name: "Sound" })).toBeVisible();
  await page.getByRole("button", { name: "Close Sound" }).click();

  const room = page.locator(".nest-room");
  const focus = page.getByRole("button", { name: "Focus mode" });
  const immersive = page.getByRole("button", { name: "Immersive mode" });
  const watch = page.getByRole("button", { name: "Watch mode" });

  await immersive.click();
  await expect(room).toHaveClass(/layout-immersive/);
  await expect(immersive).toHaveAttribute("aria-pressed", "true");

  await watch.click();
  await expect(room).toHaveClass(/layout-watch/);
  await expect(watch).toHaveAttribute("aria-pressed", "true");

  await focus.click();
  await expect(room).toHaveClass(/layout-focus/);
  await expect(focus).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "45", exact: true }).click();
  await expect(page.getByLabel("Set up focus timer").locator(".timer-readout")).toHaveText("45:00");

  await page.getByRole("button", { name: "Custom", exact: true }).click();
  const customMinutes = page.getByRole("spinbutton", { name: "Minutes" });
  await expect(customMinutes).toBeVisible();
  await customMinutes.fill("37");
  await expect(customMinutes).toHaveValue("37");

  await page.getByRole("button", { name: "∞", exact: true }).click();
  await expect(page.getByLabel("Set up focus timer").locator(".timer-readout")).toHaveText("∞");

  await page.getByRole("button", { name: "25", exact: true }).click();
  await page.getByPlaceholder("One thing. Keep it simple.").fill("Verify every control");
  await page.getByRole("button", { name: /Begin focus/ }).click();
  const timer = page.getByLabel("Current focus timer");
  await expect(timer).toBeVisible();

  await timer.getByRole("button", { name: "Pause" }).click();
  await expect(timer.getByRole("button", { name: "Resume" })).toBeVisible();
  const beforeExtend = await timer.locator(".timer-readout").textContent();
  await timer.getByRole("button", { name: "10 min" }).click();
  await expect(timer.locator(".timer-readout")).not.toHaveText(beforeExtend ?? "25:00");
  await timer.getByRole("button", { name: "Resume" }).click();
  await expect(timer.getByRole("button", { name: "Pause" })).toBeVisible();

  await timer.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("dialog", { name: "Focus session complete" })).toBeVisible();
  await page.getByRole("dialog", { name: "Focus session complete" }).getByRole("button", { name: /Finish/ }).click();
  await expect(page.getByRole("dialog", { name: "Focus session complete" })).toBeHidden();

  await page.getByRole("button", { name: "Fullscreen" }).first().click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __nestFullscreenTest?: { requests: number } }).__nestFullscreenTest?.requests ?? 0)).toBe(1);
  await page.getByRole("button", { name: "Fullscreen" }).first().click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __nestFullscreenTest?: { exits: number } }).__nestFullscreenTest?.exits ?? 0)).toBe(1);

  await page.getByRole("button", { name: /Tokyo Café/ }).click();
  await expect(page.getByRole("heading", { name: "Where do you want to be?" })).toBeVisible();
  await page.getByRole("button", { name: /Late-Night Coding/ }).click();
  await expect(page.getByRole("heading", { name: "Late Night" })).toBeVisible();
});

test("arrival and room backplates use the authored asset for the current time", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".arrival-shell")).toHaveAttribute("data-time-of-day", "day");
  await expect(page.locator(".environment-scene")).toHaveAttribute("data-scene-asset", /-day\.jpg$/);

  for (const door of await page.locator(".place-door").all()) {
    await expect(door).toHaveAttribute("data-scene-asset", /-day\.jpg$/);
  }

  await page.getByRole("button", { name: /Late-Night Coding/ }).click();
  await expect(page.locator(".environment-scene")).toHaveAttribute("data-scene-asset", /late-night-day\.jpg$/);
});
