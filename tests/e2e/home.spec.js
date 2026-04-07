import { expect, test } from "@playwright/test";
import {
  confirmManualLocation,
  denyGeolocation,
  extractBanner,
  extractCard,
  parseDistanceMeters,
  pharmacyCards,
  requestLocation,
  scrollToBottom,
  scrollToTop,
  waitForLocatedResults,
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
      await expect(page.getByTestId("location-button")).toBeVisible();
    }
  });

  test("uses geolocation and surfaces a closest pharmacy", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

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
    await waitForLocatedResults(page);

    const cards = pharmacyCards(page);
    await expect(cards.first()).toBeVisible();
    const selectedCard = cards.nth(1);
    const selected = await extractCard(selectedCard);

    await selectedCard.click();

    await expect.poll(
      async () => {
        const banner = await extractBanner(page);
        return `${banner.label.toLowerCase()}|||${banner.title}`;
      },
      {
        timeout: 10000
      }
    ).toBe(`farmacia seleccionada|||${selected.title}`);

    await page.getByTestId("reset-selection-button").click();
    await waitForLocatedResults(page);
    const nearestAfterReset = await extractCard(cards.first());
    const banner = await extractBanner(page);
    expect(banner.label.toLowerCase()).toContain("mas cercana ahora");
    expect(banner.title).toBe(nearestAfterReset.title);
  });

  test("can choose a manual location when geolocation is denied", async ({ page }) => {
    await denyGeolocation(page);
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.getByTestId("manual-location-button")).toBeVisible();
    await confirmManualLocation(page);
    await waitForLocatedResults(page);

    const cards = pharmacyCards(page);
    const banner = await extractBanner(page);
    const firstCard = await extractCard(cards.first());

    await expect(page.getByTestId("location-state")).toContainText(/punto/i);
    expect(banner.title).toBe(firstCard.title);
  });

  test("shows a floating mini map in list view after scrolling away from the hero", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    await scrollToBottom(page);
    await expect(page.getByTestId("floating-mini-map")).toBeVisible();

    await scrollToTop(page);
    await expect
      .poll(async () => await page.getByTestId("floating-mini-map").count(), {
        timeout: 10000
      })
      .toBe(0);
  });

  test("keeps list context when selecting a different pharmacy with the floating mini map visible", async ({
    page
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    const cards = pharmacyCards(page);
    await scrollToBottom(page);
    await expect(page.getByTestId("floating-mini-map")).toBeVisible();
    await expect(cards.nth(1)).toBeVisible();
    const selected = await extractCard(cards.nth(1));

    const beforeSelectionY = await page.evaluate(() => window.scrollY);
    await cards.nth(1).click();

    await expect
      .poll(async () => {
        const banner = await extractBanner(page);
        return banner.title;
      })
      .toBe(selected.title);

    await expect
      .poll(async () => {
        return await page.evaluate(() => window.scrollY);
      })
      .toBeGreaterThan(beforeSelectionY - 120);
  });

  test("scrolls back to the hero when the floating mini map is tapped", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    await scrollToBottom(page);
    await expect(page.getByTestId("floating-mini-map")).toBeVisible();

    await page.getByTestId("floating-mini-map").click();

    await expect
      .poll(async () => {
        const box = await page.getByTestId("hero-section").boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      })
      .toBeLessThan(40);
  });

  test("shows clickable phone links in the selected pharmacy and list when available", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    const cards = pharmacyCards(page);
    const cardsWithPhone = cards.filter({ has: page.getByTestId("pharmacy-card-phone") });
    await expect(cardsWithPhone.first()).toBeVisible();

    const firstPhoneCard = cardsWithPhone.first();
    const phoneHref = await firstPhoneCard.getByTestId("pharmacy-card-phone").getAttribute("href");
    expect(phoneHref).toMatch(/^tel:\+/);

    await firstPhoneCard.click();
    await expect
      .poll(async () => await page.getByTestId("active-pharmacy-phone").getAttribute("href"))
      .toBe(phoneHref);
  });

  test("scrolls back to the hero when selecting a pharmacy on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "This test only applies to mobile as desktop behavior is already covered.");
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    const cards = pharmacyCards(page);
    await cards.nth(1).scrollIntoViewIfNeeded();
    await cards.nth(1).click();

    await expect
      .poll(async () => {
        const box = await page.getByTestId("hero-section").boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      })
      .toBeLessThan(40);
  });

  test("renders key content in every theme", async ({ page }, testInfo) => {
    await page.goto("/");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Turno del dia" })).toBeVisible();
    await expect(page.getByTestId("location-button")).toBeVisible();

    if (testInfo.project.name === "iphone-dark") {
      await expect(page.getByTestId("hero-card")).toBeVisible();
    }
  });
});
