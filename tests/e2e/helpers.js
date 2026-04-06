import { expect } from "@playwright/test";

export async function waitForHydration(page) {
  await page.waitForLoadState("networkidle");
  await page.locator("main").waitFor({ state: "visible" });
}

export async function requestLocation(page) {
  const locationButton = page.getByRole("button", { name: /usar mi ubicacion|actualizar ubicacion/i });
  await locationButton.click();
  await expect(page.getByText(/ubicacion aproximada:/i)).toBeVisible({ timeout: 15000 });
}

export function pharmacyCards(page) {
  return page.locator("article[role='button']");
}

export async function extractCard(cardLocator) {
  const title = (await cardLocator.locator("h3").textContent())?.trim() ?? "";
  const paragraphs = await cardLocator.locator("p").allTextContents();
  const lines = paragraphs.map((value) => value.trim()).filter(Boolean);
  const distanceText = lines.find((value) => /(\d+(\.\d+)?\s?km|\d+\s?m)$/i.test(value)) ?? "";

  return {
    title,
    lines,
    distanceText
  };
}

export async function extractBanner(page) {
  const hero = page.locator("section").first();
  const label = ((await hero.locator("span").first().textContent()) ?? "").trim();
  const title = ((await hero.locator("strong").first().textContent()) ?? "").trim();

  return {
    label,
    title
  };
}

export function parseDistanceMeters(distanceText) {
  const normalized = distanceText.trim().toLowerCase();

  if (normalized.endsWith("km")) {
    return Number.parseFloat(normalized.replace("km", "").trim()) * 1000;
  }

  if (normalized.endsWith("m")) {
    return Number.parseFloat(normalized.replace("m", "").trim());
  }

  return Number.NaN;
}
