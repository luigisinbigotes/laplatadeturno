import { expect, test } from "@playwright/test";
import {
  extractBanner,
  extractCard,
  parseDistanceMeters,
  pharmacyCards,
  requestLocation,
  waitForHydration
} from "./helpers";

test.describe("La Plata DeTurno", () => {
  test("loads home and shows the day-turn panel", async ({ page, browserName }) => {
    await page.goto("/");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Turno del dia" })).toBeVisible();
    await expect(page.getByTestId("list-view-button")).toBeVisible();
    await expect(page.getByTestId("map-view-button")).toBeVisible();

    if (browserName === "chromium") {
      await expect(page.getByTestId("install-prompt")).toBeVisible();
    }
  });

  test("uses geolocation and surfaces a closest pharmacy", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);

    const cards = pharmacyCards(page);
    await expect(cards.first()).toBeVisible();
    await expect(cards.nth(1)).toBeVisible();

    const firstCard = await extractCard(cards.first());
    const secondCard = await extractCard(cards.nth(1));
    const banner = await extractBanner(page);

    expect(banner.label.toLowerCase()).toContain("mas cercana ahora");
    expect(banner.title).toBe(firstCard.title);
    expect(parseDistanceMeters(firstCard.distanceText)).toBeLessThanOrEqual(
      parseDistanceMeters(secondCard.distanceText)
    );
  });

  test("can switch to map view", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    await page.getByTestId("map-view-button").click();
    await expect(page.getByTestId("turno-map")).toBeVisible();
  });

  test("can select a pharmacy and return to the closest one", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);

    const cards = pharmacyCards(page);
    await expect(cards.first()).toBeVisible();
    const nearest = await extractCard(cards.first());
    const selected = await extractCard(cards.nth(1));

    await cards.nth(1).click();

    let banner = await extractBanner(page);
    expect(banner.label.toLowerCase()).toContain("farmacia seleccionada");
    expect(banner.title).toBe(selected.title);

    await page.getByTestId("reset-selection-button").click();
    banner = await extractBanner(page);
    expect(banner.label.toLowerCase()).toContain("mas cercana ahora");
    expect(banner.title).toBe(nearest.title);
  });

  test("renders dark mode without losing key content", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "iphone-dark", "Dark-mode check only runs in dark project");

    await page.goto("/");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Turno del dia" })).toBeVisible();
    await expect(page.getByTestId("location-button")).toBeVisible();
  });
});
