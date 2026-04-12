import { expect, test } from "@playwright/test";
import {
  requestLocation,
  waitForLocatedResults,
  waitForHydration
} from "./helpers";

test.describe("WhatsApp Sharing", () => {
  test("should open WhatsApp with correct pharmacy metadata", async ({ page }) => {
    // 1. Setup window.open mock BEFORE navigation to be certain it's active
    await page.addInitScript(() => {
      window.__lastOpenedUrl = null;
      window.open = (url) => {
        window.__lastOpenedUrl = url;
        return null;
      };
    });

    // 2. Navigate to home and wait for hydration
    await page.goto("/");
    await waitForHydration(page);

    // 3. Request location to get nearest pharmacy
    await requestLocation(page);
    await waitForLocatedResults(page);

    const shareButton = page.getByTestId("whatsapp-share-button");
    await expect(shareButton).toBeVisible();

    // 4. Click share and capture the URL
    await shareButton.click();

    // 5. Verify the URL and content
    const sharedUrl = await page.evaluate(() => window.__lastOpenedUrl);
    expect(sharedUrl).toContain("whatsapp.com/send");
    
    const decodedText = decodeURIComponent(sharedUrl);
    
    // Assert it contains key metadata based on common pharmacy strings
    expect(decodedText).toContain("Farmacia");
    // Verify emojis via their strings or unicode
    expect(decodedText).toContain("\uD83D\uDCCD"); // 📍
    expect(decodedText).toContain("Ver en el mapa:");
    expect(decodedText).toContain("https://www.google.com/maps");
  });
});
