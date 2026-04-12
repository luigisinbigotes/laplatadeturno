import { expect, test } from "@playwright/test";
import {
  requestLocation,
  waitForLocatedResults,
  waitForHydration
} from "./helpers";

test.describe("WhatsApp Share", () => {
  // Mock geolocation at La Plata
  test.use({
    geolocation: { latitude: -34.9214, longitude: -57.9545 },
    permissions: ["geolocation"]
  });

  test("verifies the 'Share via WhatsApp' button opens the correct URL with pharmacy details", async ({ page }) => {
    // 1. Navigate to the home page
    await page.goto("/");
    await waitForHydration(page);

    // 2. Trigger location request and wait for results to stabilize
    await requestLocation(page);
    await waitForLocatedResults(page);

    // Get the active pharmacy details from the hero section to verify against the share link
    const activeName = await page.getByTestId("active-pharmacy-name").textContent();
    const activeAddress = await page.getByTestId("active-pharmacy-address").textContent();

    expect(activeName).toBeTruthy();
    expect(activeAddress).toBeTruthy();

    // 3. Mock window.open to intercept the WhatsApp URL
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedWhatsappUrl = url;
      };
    });

    // 4. Click the "Compartir" button
    const shareButton = page.getByTestId("whatsapp-share-button");
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    // 5. Verify the captured URL matches the expected format and content
    const capturedUrl = await page.evaluate(() => window.capturedWhatsappUrl);
    
    expect(capturedUrl, "window.open should have been called").toBeTruthy();
    expect(capturedUrl).toContain("https://wa.me/?text=");

    // Decode the text parameter to check its contents
    const urlObj = new URL(capturedUrl);
    const textParam = urlObj.searchParams.get("text");
    expect(textParam).toBeTruthy();

    const decodedText = textParam;
    expect(decodedText).toContain(activeName.trim());
    expect(decodedText).toContain(activeAddress.trim());
    expect(decodedText).toContain("🗺️ Ver en el mapa:");
    
    // Check that it includes a google maps or similar link (activePharmacy.mapUrl)
    expect(decodedText).toMatch(/https?:\/\//);
  });
});
