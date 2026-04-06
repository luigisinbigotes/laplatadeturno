export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return Response.json(
      { error: "invalid_coordinates" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const fallback = [
    [fromLat, fromLng],
    [toLat, toLng]
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url =
      `https://routing.openstreetmap.de/routed-foot/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "DeTurnoBot/0.1 (+https://localhost)"
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("route_failed");
    }

    const data = await response.json();
    const coordinates = data.routes?.[0]?.geometry?.coordinates ?? [];
    const points = coordinates.map(([lng, lat]) => [lat, lng]);

    if (!points.length) {
      throw new Error("empty_route");
    }

    return Response.json(
      {
        mode: "walking",
        source: "routing.openstreetmap.de",
        fallback: false,
        points
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch {
    return Response.json(
      {
        mode: "walking",
        source: "fallback",
        fallback: true,
        points: fallback
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
