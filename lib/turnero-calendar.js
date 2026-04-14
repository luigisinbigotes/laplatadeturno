import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
const pdfjsPackagePath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const standardFontDataUrl = `${pathToFileURL(path.join(pdfjsPackagePath, "standard_fonts")).href}/`;

const CURRENT_TURNERO_URL = "https://www.colfarmalp.org.ar/wp-content/uploads/turnos/lp.pdf";
const NEXT_TURNERO_URL = "https://www.colfarmalp.org.ar/wp-content/uploads/turnos/lp_proximo.pdf";
const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1";
const COLUMN_SPLIT_X = 300;
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
  const response = await fetch(url, {
    headers: {
      "User-Agent": "DeTurnoBot/0.1 (+https://localhost)"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const pdfBytes = new Uint8Array(await response.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({
    data: pdfBytes,
    standardFontDataUrl
  }).promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();

  const items = textContent.items
    .map((item) => ({
      text: String(item.str ?? "").trim(),
      x: Number(item.transform?.[4] ?? 0),
      y: Number(item.transform?.[5] ?? 0)
    }))
    .filter((item) => item.text);

  const monthItem = items.find((item) => /^[A-ZÁÉÍÓÚÑ]+ \d{4}$/i.test(item.text));
  if (!monthItem) {
    return null;
  }

  const [monthText, yearText] = monthItem.text.toLowerCase().split(/\s+/);
  const month = MONTH_INDEX[monthText];
  const year = Number(yearText);

  if (!Number.isInteger(month) || !Number.isFinite(year)) {
    return null;
  }

  return {
    sourceUrl: url,
    month,
    year,
    days: parseDayBlocks(items)
  };
}

function parseDayBlocks(items) {
  const leftItems = items.filter((item) => item.x < COLUMN_SPLIT_X);
  const rightItems = items
    .filter((item) => item.x >= COLUMN_SPLIT_X)
    .map((item) => ({ ...item, x: item.x - COLUMN_SPLIT_X }));

  return new Map([...parseHalf(leftItems), ...parseHalf(rightItems)]);
}

function parseHalf(items) {
  const dayNumbers = items
    .filter((item) => /^\d{2}$/.test(item.text) && item.x < 40)
    .sort((a, b) => b.y - a.y);

  return dayNumbers.map((current, index) => {
    const next = dayNumbers[index + 1];
    const upperBound = current.y + 26;
    const lowerBound = next ? next.y + 26 : -Infinity;

    const addresses = items
      .filter((item) => item.x >= 35 && item.y <= upperBound && item.y > lowerBound)
      .filter((item) => looksLikeAddress(item.text))
      .sort((a, b) => (a.x === b.x ? b.y - a.y : a.x - b.x))
      .map((item) => normalizeAddress(item.text));

    return [Number(current.text), [...new Set(addresses)]];
  });
}

function looksLikeAddress(value) {
  return /\d/.test(value);
}

function normalizeAddress(value) {
  return value.replace(/\s+/g, " ").trim();
}

function buildAddressMapUrl(address) {
  const url = new URL(GOOGLE_MAPS_SEARCH_URL);
  url.searchParams.set("query", `${address}, La Plata, Buenos Aires`);
  return url.toString();
}
