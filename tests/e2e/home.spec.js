import { expect, test } from "@playwright/test";

async function waitForHydration(page) {
  await page.waitForLoadState("networkidle");
  await page.locator("main").waitFor({ state: "visible" });
}

test.describe("La Plata DeTurno", () => {
  test("loads home and shows the day-turn panel", async ({ page, browserName }) => {
    await page.goto("/");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Turno del dia" })).toBeVisible();
    await expect(page.getByRole("button", { name: /lista/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /mapa/i })).toBeVisible();

    if (browserName === "chromium") {
      await expect(page.getByText(/instalar app/i)).toBeVisible();
    }
  });

  test("uses geolocation and surfaces a closest pharmacy", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const locationButton = page.getByRole("button", { name: /usar mi ubicacion|actualizar ubicacion/i });
    await locationButton.click();

    await expect(page.getByText(/ubicacion aproximada:/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/mas cercana ahora|farmacia seleccionada/i)).toBeVisible();
    await expect(page.getByText(/m|km/).first()).toBeVisible();
  });

  test("can switch to map view", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    await page.getByRole("button", { name: /mapa/i }).click();
    await expect(page.locator(".leaflet-container").first()).toBeVisible();
  });

  test("can select a pharmacy and return to the closest one", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    await page.getByRole("button", { name: /usar mi ubicacion|actualizar ubicacion/i }).click();
    await expect(page.getByText(/ubicacion aproximada:/i)).toBeVisible({ timeout: 15000 });

    const cards = page.locator("article[role='button']");
    await expect(cards.first()).toBeVisible();
    await cards.nth(1).click();

    await expect(page.getByText(/farmacia seleccionada/i)).toBeVisible();
    await page.getByRole("button", { name: /volver a la mas cercana/i }).click();
    await expect(page.getByText(/mas cercana ahora/i)).toBeVisible();
  });

  test("renders dark mode without losing key content", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "iphone-dark", "Dark-mode check only runs in dark project");

    await page.goto("/");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Turno del dia" })).toBeVisible();
    await expect(page.getByRole("button", { name: /usar mi ubicacion/i })).toBeVisible();
  });
});
