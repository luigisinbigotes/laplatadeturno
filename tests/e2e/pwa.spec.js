import { expect, test } from "@playwright/test";

test.describe("PWA surface", () => {
  test("serves the manifest with expected metadata", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe("La Plata DeTurno");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(1);
  });

  test("serves the generated icon", async ({ request }) => {
    const response = await request.get("/icon?size=192&v=2");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  });
});
