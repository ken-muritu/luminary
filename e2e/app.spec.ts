import { expect, test } from "@playwright/test";

test("app loads onboarding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to Luminary v3")).toBeVisible({ timeout: 60_000 });
});

test("onboarding completes and shows dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to Luminary v3")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByText("Setlist")).toBeVisible();
  await expect(page.getByRole("button", { name: "Go Live" })).toBeVisible();
});

test("settings shows Whisper STT options", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to Luminary v3")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByText("AI — Whisper STT")).toBeVisible();
  await expect(page.getByText("Auto-project detected verses")).toBeVisible();
});

test("welcome query shows personalized onboarding", async ({ page }) => {
  await page.goto("/?welcome=1&name=Test%20User");
  await expect(page.getByText("Welcome, Test User")).toBeVisible({ timeout: 60_000 });
});
