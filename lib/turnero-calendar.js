import { PDFParse } from "pdf-parse";

const CURRENT_TURNERO_URL = "https://www.colfarmalp.org.ar/wp-content/uploads/turnos/lp.pdf";
const NEXT_TURNERO_URL = "https://www.colfarmalp.org.ar/wp-content/uploads/turnos/lp_proximo.pdf";
const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1";
const MONTH_INDEX = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11
};

export async function fetchTomorrowTurnos(referenceDate = new Date()) {
  const targetDate = new Date(referenceDate);
  targetDate.setHours(0, 0, 0, 0);
  targetDate.setDate(targetDate.getDate() + 1);

  const turnero = await resolveTurneroForDate(targetDate);
  const addresses = turnero.days.get(targetDate.getDate());

  if (!addresses?.length) {
    throw new Error("No se pudo encontrar el turnero de mañana en el PDF oficial.");
  }

  return {
    targetDate,
    sourceUrl: turnero.sourceUrl,
    pharmacies: addresses.map((address) => ({
      name: address,
      address,
      zone: "La Plata",
      phone: "",
      mapUrl: buildAddressMapUrl(address),
      latitude: null,
      longitude: null,
      addressOnly: true,
      distanceKm: null
    }))
  };
}

async function resolveTurneroForDate(targetDate) {
  const candidates = [
    await fetchAndParseTurnero(NEXT_TURNERO_URL),
    await fetchAndParseTurnero(CURRENT_TURNERO_URL)
  ].filter(Boolean);

  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  const match = candidates.find((candidate) => candidate.month === targetMonth && candidate.year === targetYear);
  if (match) {
    return match;
  }

  throw new Error("No encontramos un turnero oficial para la fecha solicitada.");
}

async function fetchAndParseTurnero(url) {
  const parser = new PDFParse({ url });

  try {
    const result = await parser.getText();
    const rawText = String(result.text ?? "");
    const [month, year] = extractMonthYear(rawText);

    return {
      sourceUrl: url,
      month,
      year,
      days: parseDayBlocks(rawText)
    };
  } finally {
    await parser.destroy();
  }
}

function extractMonthYear(text) {
  const match = text.match(
    /\b(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+(\d{4})\b/i
  );

  if (!match) {
    throw new Error("No se pudo detectar el mes del turnero.");
  }

  const month = MONTH_INDEX[match[1].toLowerCase()];
  const year = Number(match[2]);

  if (!Number.isInteger(month) || !Number.isFinite(year)) {
    throw new Error("El turnero tiene un encabezado de fecha inválido.");
  }

  return [month, year];
}

function parseDayBlocks(text) {
  const normalized = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const days = new Map();
  let currentDay = null;
  let pendingDayLabel = false;

  for (const line of normalized) {
    if (/^(lun\.|mar\.|mié\.|mie\.|jue\.|vie\.|sáb\.|sab\.|dom\.?)$/i.test(line)) {
      pendingDayLabel = true;
      continue;
    }

    if (pendingDayLabel && /^\d{2}$/.test(line)) {
      currentDay = Number(line);
      if (!days.has(currentDay)) {
        days.set(currentDay, []);
      }
      pendingDayLabel = false;
      continue;
    }

    pendingDayLabel = false;

    if (currentDay == null || !looksLikeAddress(line)) {
      continue;
    }

    days.get(currentDay).push(normalizeAddress(line));
  }

  for (const [day, addresses] of days.entries()) {
    days.set(day, [...new Set(addresses)]);
  }

  return days;
}

function looksLikeAddress(value) {
  return /\d/.test(value) && value.length >= 4;
}

function normalizeAddress(value) {
  return value.replace(/\s+/g, " ").trim();
}

function buildAddressMapUrl(address) {
  const url = new URL(GOOGLE_MAPS_SEARCH_URL);
  url.searchParams.set("query", `${address}, La Plata, Buenos Aires`);
  return url.toString();
}
