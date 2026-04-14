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
    await expect(page.getByTestId("day-scope-button")).toHaveText(/ver mañana/i);

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

  test("can switch to tomorrow and return to today", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    await page.getByTestId("day-scope-button").click();
    await expect(page.getByTestId("day-scope-heading")).toHaveText(/turno de mañana/i, {
      timeout: 20000
    });
    await expect(page.getByTestId("day-scope-button")).toHaveText(/volver a hoy/i);
    await expect(page.getByTestId("summary-text")).toContainText(/mañana/i);
    await expect(page.getByTestId("active-pharmacy-distance")).toHaveCount(0);

    await page.getByTestId("day-scope-button").click();
    await expect(page.getByTestId("day-scope-heading")).toHaveText(/turno del dia/i, {
      timeout: 20000
    });
  });

  test("can select a pharmacy and return to the closest one", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    const cards = pharmacyCards(page);
    await expect(cards.first()).toBeVisible();
    
    const selectedCard = cards.nth(1);
    const key = await selectedCard.getAttribute("data-pharmacy-key");
    const selected = await extractCard(selectedCard);

    // Ensure it is in view and click (scrolled to center to avoid floating map and headers)
    const targetLocator = page.locator(`article[data-pharmacy-key="${key}"]`);
    await targetLocator.evaluate(el => el.scrollIntoView({ block: "center" }));
    await targetLocator.click({ force: true });

    await expect.poll(
      async () => {
        const banner = await extractBanner(page);
        return `${banner.label.toLowerCase()}|||${banner.title}`;
      },
      { timeout: 20000 }
    ).toBe(`farmacia seleccionada|||${selected.title}`);

    await page.getByTestId("reset-selection-button").scrollIntoViewIfNeeded();
    await page.getByTestId("reset-selection-button").click({ force: true });
    await page.waitForTimeout(500);
    await waitForLocatedResults(page);
    const firstCard = await extractCard(cards.first());
    const banner = await extractBanner(page);
    expect(banner.label.toLowerCase()).toContain("mas cercana ahora");
    expect(banner.title).toBe(firstCard.title);
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
        timeout: 15000
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
    await expect(cards.last()).toBeVisible();
    const targetCard = cards.last();
    const selected = await extractCard(targetCard);

    const beforeSelectionY = await page.evaluate(() => window.scrollY);
    await targetCard.click({ force: true });

    await expect
      .poll(async () => {
        const banner = await extractBanner(page);
        return banner.title;
      }, { timeout: 20000 })
      .toBe(selected.title);

    const afterSelectionY = await page.evaluate(() => window.scrollY);
    expect(afterSelectionY).toBeGreaterThan(beforeSelectionY - 500);
  });

  test("scrolls back to the hero when the floating mini map is tapped", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    await scrollToBottom(page);
    await expect(page.getByTestId("floating-mini-map")).toBeVisible();

    await page.getByTestId("floating-mini-map").click({ force: true });
    await page.waitForTimeout(1000);

    await expect
      .poll(async () => {
        const box = await page.getByTestId("hero-section").boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      }, { timeout: 15000 })
      .toBeLessThan(300);
  });

  test("shows clickable phone links in the selected pharmacy and list when available", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    const cards = pharmacyCards(page);
    const cardsWithPhone = cards.filter({ has: page.getByTestId("pharmacy-card-phone") });
    
    if (await cardsWithPhone.count() === 0) {
      test.skip(true, "No pharmacies with phone numbers found in results.");
      return;
    }

    const firstPhoneCard = cardsWithPhone.first();
    const key = await firstPhoneCard.getAttribute("data-pharmacy-key");
    const phoneHref = await firstPhoneCard.getByTestId("pharmacy-card-phone").getAttribute("href");
    const selectedTitle = (await extractCard(firstPhoneCard)).title;

    expect(phoneHref).toMatch(/^tel:\+/);

    // Select the card first (scrolled to center to avoid floating map)
    const targetLocator = page.locator(`article[data-pharmacy-key="${key}"]`);
    await targetLocator.evaluate(el => el.scrollIntoView({ block: "center" }));
    await targetLocator.click({ force: true });
    
    // Wait for selection to propagate
    await expect.poll(async () => (await extractBanner(page)).title, { timeout: 20000 }).toBe(selectedTitle);

    await expect
      .poll(async () => await page.getByTestId("active-pharmacy-phone").getAttribute("href"), { timeout: 15000 })
      .toBe(phoneHref);
  });

  test("does not scroll back to the hero when selecting a pharmacy on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "This test only applies to mobile as desktop behavior is already covered.");
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    // Scroll to bottom so hero is far away
    await scrollToBottom(page);
    
    const cards = pharmacyCards(page);
    await expect(cards.last()).toBeVisible();
    await cards.last().click({ force: true });
    
    // Wait enough for a potential smooth scroll to finish if it were to happen
    await page.waitForTimeout(1500);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(500);
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

  test("shows the share via whatsapp button when a pharmacy is active", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await requestLocation(page);
    await waitForLocatedResults(page);

    const shareButton = page.getByTestId("whatsapp-share-button");
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toContainText("Compartir");
  });
});
