const addressCache = new Map();

function buildApproximateAddress(address) {
  if (!address) {
    return null;
  }

  const road = address.road || address.pedestrian || address.footway || address.path;
  const houseNumber = address.house_number;
  const suburb = address.suburb || address.neighbourhood || address.city_district;
  const city = address.city || address.town || address.village || address.county;

  const firstLine = [road, houseNumber].filter(Boolean).join(" ");
  const secondLine = [suburb, city].filter(Boolean).join(", ");
  const label = [firstLine, secondLine].filter(Boolean).join(", ");

  return label || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));

  if (![latitude, longitude].every(Number.isFinite)) {
    return Response.json(
      { error: "invalid_coordinates" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const cacheKey = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
  const cached = addressCache.get(cacheKey);
  if (cached) {
    return Response.json(cached, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "DeTurnoBot/0.1 (+https://localhost)"
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("reverse_geocode_failed");
    }

    const data = await response.json();
    const result = {
      label:
        buildApproximateAddress(data.address) ||
        data.display_name?.split(",").slice(0, 3).join(", ").trim() ||
        null
    };

    addressCache.set(cacheKey, result);

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return Response.json(
      { label: null },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
