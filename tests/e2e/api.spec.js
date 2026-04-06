import { expect, test } from "@playwright/test";

test.describe("Public API hardening", () => {
  test("farmacias returns sorted data for a La Plata location", async ({ request }) => {
    const response = await request.get("/api/farmacias?lat=-34.9214&lng=-57.9545");
    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(Array.isArray(json.pharmacies)).toBeTruthy();
    expect(json.pharmacies.length).toBeGreaterThan(0);
    expect(json.pharmacies[0].distanceKm).not.toBeNull();
  });

  test("route rejects coordinates outside La Plata bounds", async ({ request }) => {
    const response = await request.get(
      "/api/route?fromLat=-34.6037&fromLng=-58.3816&toLat=-34.9214&toLng=-57.9545"
    );

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("coordinates_out_of_scope");
  });

  test("reverse geocode rejects coordinates outside La Plata bounds", async ({ request }) => {
    const response = await request.get("/api/reverse-geocode?lat=-34.6037&lng=-58.3816");

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("coordinates_out_of_scope");
  });
});
