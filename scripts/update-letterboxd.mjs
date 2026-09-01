import { constants } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { ratingLabel } from "./lib/rating-label.mjs";

const FEED_URL = "https://letterboxd.com/vcaleb/rss/";
const OUTPUT_URL = new URL("../src/_data/letterboxd.json", import.meta.url);

const decodeEntities = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&apos;", "'")
  .replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const textFrom = (item, tag) => {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = item.match(new RegExp(`<${escaped}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${escaped}>`, "i"));
  return decodeEntities(match?.[1]?.trim() || "");
};

async function updateFeed() {
  const response = await fetch(FEED_URL, {
    headers: { "user-agent": "calebagoha.com portfolio feed updater" }
  });
  if (!response.ok) throw new Error(`Letterboxd returned ${response.status}`);

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const recent = items.map((item) => {
    const description = textFrom(item, "description");
    const poster = decodeEntities(description.match(/<img\s+src="([^"]+)"/i)?.[1] || "");
    const rating = textFrom(item, "letterboxd:memberRating");
    return {
      title: textFrom(item, "letterboxd:filmTitle"),
      year: textFrom(item, "letterboxd:filmYear"),
      watchedDate: textFrom(item, "letterboxd:watchedDate"),
      rating,
      ratingLabel: ratingLabel(rating),
      link: textFrom(item, "link"),
      poster
    };
  }).filter((film) => film.title && film.poster).slice(0, 2);

  if (recent.length < 2) {
    throw new Error("Letterboxd feed did not contain two complete diary entries");
  }

  await writeFile(OUTPUT_URL, `${JSON.stringify(recent, null, 2)}\n`);
  console.log(`Updated recent Letterboxd watches: ${recent.map((film) => film.title).join(', ')}`);
}

try {
  await updateFeed();
} catch (error) {
  try {
    await access(fileURLToPath(OUTPUT_URL), constants.R_OK);
    console.warn(`Letterboxd refresh failed; keeping committed fallback data. ${error.message}`);
  } catch {
    throw error;
  }
}
