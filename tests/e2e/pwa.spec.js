import { expect, test } from "@playwright/test";

test.describe("PWA surface", () => {
  test("serves the manifest with expected metadata", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe("La Plata DeTurno");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBeTruthy();
    expect(Array.isArray(manifest.icons)).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(1);
    
    // Check for icons. Next.js might generate them with specific paths.
    const iconSrcs = manifest.icons.map(i => i.src);
    expect(iconSrcs.some(src => src.includes("icon"))).toBeTruthy();
  });

  test("serves the generated small icon", async ({ request }) => {
    // Try to find the icon URL from the manifest first
    const manifestRes = await request.get("/manifest.webmanifest");
    const manifest = await manifestRes.json();
    const smallIcon = manifest.icons.find(i => i.sizes === "32x32" || i.src.includes("small"));
    
    const url = smallIcon ? smallIcon.src : "/icon/small";
    const response = await request.get(url);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("serves the generated medium icon", async ({ request }) => {
    // Try to find the icon URL from the manifest first
    const manifestRes = await request.get("/manifest.webmanifest");
    const manifest = await manifestRes.json();
    const mediumIcon = manifest.icons.find(i => i.sizes === "192x192" || i.src.includes("medium"));
    
    const url = mediumIcon ? mediumIcon.src : "/icon/medium";
    const response = await request.get(url);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("serves the generated apple icon", async ({ request }) => {
    const response = await request.get("/apple-icon");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  });
});
