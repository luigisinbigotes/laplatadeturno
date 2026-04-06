import { expect } from "@playwright/test";

export async function waitForHydration(page) {
  await page.waitForLoadState("networkidle");
  await page.getByTestId("home-page").waitFor({ state: "visible" });
}

export async function denyGeolocation(page) {
  await page.addInitScript(() => {
    const geolocation = {
      getCurrentPosition(success, error) {
        if (typeof error === "function") {
          error({
            code: 1,
            message: "Permission denied"
          });
        }
      },
      watchPosition() {
        return 0;
      },
      clearWatch() {}
    };

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: geolocation
    });
  });
}

export async function requestLocation(page) {
  const locationButton = page.getByTestId("location-button");
  await locationButton.click();
  await expect(page.getByTestId("location-state")).toContainText(/ubicacion aproximada:/i, {
    timeout: 15000
  });
}

export async function confirmManualLocation(page) {
  await page.getByTestId("manual-location-button").click();
  await expect(page.getByTestId("manual-location-modal")).toBeVisible();
  await page.getByTestId("manual-location-confirm").click();
  await expect(page.getByTestId("location-state")).toContainText(/punto/i, {
    timeout: 15000
  });
}

export async function waitForLocatedResults(page) {
  const cards = pharmacyCards(page);
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().getByTestId("pharmacy-card-distance")).toBeVisible({ timeout: 15000 });
  await expect(cards.nth(1).getByTestId("pharmacy-card-distance")).toBeVisible({ timeout: 15000 });

  await expect.poll(
    async () => {
      const firstCardTitle = ((await cards.first().getByTestId("pharmacy-card-name").textContent()) ?? "").trim();
      const bannerTitle = ((await page.getByTestId("active-pharmacy-name").textContent()) ?? "").trim();
      return Boolean(bannerTitle) && bannerTitle === firstCardTitle;
    },
    {
      timeout: 15000
    }
  ).toBe(true);
}

export function pharmacyCards(page) {
  return page.locator("article[role='button'][data-testid^='pharmacy-card-']");
}

export async function extractCard(cardLocator) {
  const title = ((await cardLocator.getByTestId("pharmacy-card-name").textContent()) ?? "").trim();
  const address = ((await cardLocator.getByTestId("pharmacy-card-address").textContent()) ?? "").trim();
  const meta = ((await cardLocator.getByTestId("pharmacy-card-meta").textContent()) ?? "").trim();
  const distanceLocator = cardLocator.getByTestId("pharmacy-card-distance");
  const distanceText = (await distanceLocator.count()) ? ((await distanceLocator.textContent()) ?? "").trim() : "";

  return {
    title,
    lines: [address, meta, distanceText].filter(Boolean),
    distanceText
  };
}

export async function extractBanner(page) {
  const label = ((await page.getByTestId("active-pharmacy-label").textContent()) ?? "").trim();
  const title = ((await page.getByTestId("active-pharmacy-name").textContent()) ?? "").trim();

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

export async function scrollToBottom(page) {
  await page.evaluate(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "auto"
    });
  });
}

export async function scrollToTop(page) {
  await page.evaluate(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto"
    });
  });
}
