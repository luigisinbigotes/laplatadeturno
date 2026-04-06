import {
  fetchLaPlataTurnos,
  sortPharmaciesByDistance
} from "@/lib/farmacias";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");

  const pharmacies = await fetchLaPlataTurnos();
  const sorted = sortPharmaciesByDistance(pharmacies, latitude, longitude);

  return Response.json(
    {
      city: "La Plata",
      source: "https://www.colfarmalp.org.ar/turnos-la-plata/",
      fetchedAt: new Date().toISOString(),
      userLocation:
        latitude && longitude
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude)
            }
          : null,
      pharmacies: sorted
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
