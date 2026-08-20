import { expect, test } from "@playwright/test";
import { enterNest, installExternalHarness, readPersistedNestData, startFocus } from "./nestTestHarness";

test.beforeEach(async ({ page }) => {
  const testTime = new Date("2026-08-20T10:00:00");
  await page.clock.install({ time: testTime });
  await page.clock.pauseAt(new Date(testTime.getTime() + 60_000));
  await installExternalHarness(page);
});

test("enter Nest with the keyboard and keep place cards accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Where do you want to be?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Rainy Tokyo Café/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Summer Sunset/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Late-Night Coding/ })).toBeVisible();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /Rainy Tokyo Café/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Set up focus timer")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tokyo Café" })).toBeVisible();
});

test("focus, pause, resume, finish, and persist history", async ({ page }) => {
  await enterNest(page);
  await startFocus(page, "Finish the integration suite");
  const timer = page.getByLabel("Current focus timer");
  await expect(timer).toContainText("Finish the integration suite");
  await expect(timer.locator(".timer-readout")).toHaveText("25:00");

  await timer.getByRole("button", { name: "Pause" }).click();
  const pausedAt = await timer.locator(".timer-readout").textContent();
  await page.clock.fastForward(10_000);
  await expect(timer.locator(".timer-readout")).toHaveText(pausedAt ?? "25:00");
  await timer.getByRole("button", { name: "Resume" }).click();
  await page.clock.fastForward(2_000);
  await expect(timer.locator(".timer-readout")).not.toHaveText(pausedAt ?? "25:00");

  await timer.getByRole("button", { name: "Finish" }).click();
  const completion = page.getByRole("dialog", { name: "Focus session complete" });
  await completion.getByPlaceholder("Next: test concurrent transfers").fill("Review CI result");
  await completion.getByRole("button", { name: /Finish/ }).click();
  await page.clock.fastForward(250);
  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByRole("dialog", { name: "History" })).toContainText("Finish the integration suite");
  await expect(page.getByRole("dialog", { name: "History" })).toContainText("Review CI result");

  await expect.poll(async () => {
    const saved = await readPersistedNestData(page) as { history?: Array<{ task?: string }> } | null;
    return saved?.history?.[0]?.task ?? null;
  }).toBe("Finish the integration suite");

  await page.reload();
  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByRole("dialog", { name: "History" })).toContainText("Finish the integration suite");
});

test("restores a running timed session paused at the last persisted checkpoint", async ({ page }) => {
  await enterNest(page);
  await startFocus(page, "Restore me");
  await page.clock.fastForward(60_000);
  await expect(page.getByLabel("Current focus timer").locator(".timer-readout")).toHaveText("24:00");
  await expect.poll(async () => {
    const saved = await readPersistedNestData(page) as { activeSession?: { task?: string; runningSince?: number | null } } | null;
    return saved?.activeSession?.task ?? null;
  }).toBe("Restore me");

  await page.reload();
  const restored = page.getByLabel("Current focus timer");
  await expect(restored).toContainText("Restore me");
  await expect(restored.locator(".timer-readout")).toHaveText("24:00");
  await expect(restored.getByRole("button", { name: "Resume" })).toBeVisible();

  await page.clock.fastForward(10 * 60_000);
  await expect(restored.locator(".timer-readout")).toHaveText("24:00");
});

test("global shortcuts do not steal keyboard activation from focused controls", async ({ page }) => {
  await enterNest(page);
  await startFocus(page, "Keyboard controls");
  const pause = page.getByRole("button", { name: "Pause" });
  await pause.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Resume" })).toBeFocused();

  await page.getByLabel("YouTube player").getByRole("button", { name: "Add music" }).click();
  const name = page.getByLabel("Name");
  await name.fill("Late");
  await name.press("Space");
  await expect(name).toHaveValue("Late ");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(name).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "YouTube" })).toBeHidden();
});

test("recovers from malformed persisted state", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("nest-local", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("app", "readwrite");
        transaction.objectStore("app").put({ version: 2, settings: { environmentId: "broken" }, history: [{ id: "bad", task: 12 }] }, "state");
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
    localStorage.setItem("nest.atmosphere.v1", "{broken");
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Where do you want to be?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Rainy Tokyo Café/ })).toBeVisible();
});

test("renders at desktop, large desktop, and narrow viewports", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 430, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Where do you want to be?" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Rainy Tokyo Café/ })).toBeVisible();
  }
});
