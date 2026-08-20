import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { enterNest, installExternalHarness, startFocus } from "./nestTestHarness";

async function expectNoWcagViolations(page: Page, state: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
  expect(summary, `${state} accessibility violations`).toEqual([]);
}

test("arrival, room, panels, weather, and completion pass automated WCAG checks", async ({ page }) => {
  await installExternalHarness(page);
  await page.goto("/");
  await expectNoWcagViolations(page, "arrival");

  await page.getByRole("button", { name: /Rainy Tokyo Caf/ }).click();
  await expect(page.getByLabel("Set up focus timer")).toBeVisible();
  await expectNoWcagViolations(page, "room");

  await page.getByRole("button", { name: "Weather and local time" }).click();
  await expectNoWcagViolations(page, "weather settings");
  await page.keyboard.press("Escape");

  await page.getByLabel("YouTube player").getByRole("button", { name: "Add music" }).click();
  await expectNoWcagViolations(page, "YouTube panel");
  await page.keyboard.press("Escape");

  await startFocus(page, "Audit modal focus");
  await page.getByLabel("Current focus timer").getByRole("button", { name: "Finish" }).click();
  await expectNoWcagViolations(page, "session completion");
});

test("keyboard focus enters and leaves settings surfaces predictably", async ({ page }) => {
  await installExternalHarness(page);
  await enterNest(page);

  const historyTrigger = page.getByRole("button", { name: "History" });
  await historyTrigger.focus();
  await historyTrigger.press("Enter");
  await expect(page.getByRole("button", { name: "Close History" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(historyTrigger).toBeFocused();

  const weatherTrigger = page.getByRole("button", { name: "Weather and local time" });
  await weatherTrigger.focus();
  await weatherTrigger.press("Space");
  await expect(page.getByRole("complementary", { name: "Weather settings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(weatherTrigger).toBeFocused();

  await startFocus(page, "Trap focus safely");
  const finishTrigger = page.getByLabel("Current focus timer").getByRole("button", { name: "Finish" });
  await finishTrigger.click();
  const completion = page.getByRole("dialog", { name: "Focus session complete" });
  const note = completion.getByPlaceholder("Next: test concurrent transfers");
  const finish = completion.getByRole("button", { name: /Finish/ });
  await expect(note).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(completion).toBeVisible();
  await finish.focus();
  await page.keyboard.press("Tab");
  await expect(note).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(finish).toBeFocused();
  await finish.click();
  await expect(page.getByPlaceholder("One thing. Keep it simple.")).toBeFocused();

  await startFocus(page, "Return focus to break");
  await page.getByLabel("Current focus timer").getByRole("button", { name: "Finish" }).click();
  await page.getByRole("dialog", { name: "Focus session complete" }).getByRole("button", { name: /Take a break/ }).click();
  await expect(page.getByLabel("Break timer").getByRole("button", { name: /Ready/ })).toBeFocused();
});
