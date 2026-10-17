// Downloads extra CC0 sound effects (Freesound via Openverse, no API key) into
// sfx-library/extra/<category>/ and records them in extra/manifest.json.
// Whole recordings are kept (good for 2–3 s backgrounds), unlike the opus-sound-layer kit which slices hits.
// Openverse anonymous limits: 20 results/request, 20 requests/min, 200/day → requests are throttled.
// Usage: node tools/fetch-openverse-sfx.mjs [categoryKey ...]
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { EXTRA } from "./paths.mjs";

const UA = "ReelsRemotionProject/1.0";
const MAX_DURATION_MS = 60_000;

// key: { ru, want, minMs, maxMs, queries }
const CATEGORIES = {
  "keyboard-bg": { ru: "клавиатура фоном", want: 80, minMs: 3000, maxMs: MAX_DURATION_MS,
    queries: ["keyboard typing", "typing on keyboard", "computer keyboard typing", "mechanical keyboard typing", "office typing"] },
  "typewriter": { ru: "машинка: набор", want: 60, minMs: 2000, maxMs: MAX_DURATION_MS,
    queries: ["typewriter typing", "typewriter", "manual typewriter", "old typewriter"] },
  "typewriter-bell": { ru: "машинка: звонок и каретка", want: 40, minMs: 200, maxMs: 15_000,
    queries: ["typewriter bell", "typewriter carriage return", "typewriter ding", "typewriter carriage"] },
  "pen-writing": { ru: "перо и ручка", want: 30, minMs: 1000, maxMs: MAX_DURATION_MS,
    queries: ["pen writing paper", "quill pen writing", "pencil writing", "scribble paper"] },
  "page-turn": { ru: "листание страниц", want: 30, minMs: 300, maxMs: 20_000,
    queries: ["page turn", "book page flip", "turning pages", "paper flip"] },
  "camera-shutter": { ru: "затвор камеры", want: 30, minMs: 100, maxMs: 10_000,
    queries: ["camera shutter", "old camera shutter", "film camera click", "polaroid camera"] },
  "projector": { ru: "кинопроектор", want: 30, minMs: 2000, maxMs: MAX_DURATION_MS,
    queries: ["film projector", "old movie projector", "projector reel", "8mm projector"] },
  "laugh": { ru: "смех и реакция зала", want: 30, minMs: 500, maxMs: 20_000,
    queries: ["audience laugh", "crowd laughing", "laugh track", "people laughing", "audience gasp"] },
  "applause": { ru: "аплодисменты", want: 30, minMs: 1000, maxMs: 30_000,
    queries: ["applause", "small audience applause", "clapping crowd", "polite applause"] },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;
async function openverse(q, page) {
  const wait = 3300 - (Date.now() - lastRequest); // ≤ 20 requests/min
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  const url = `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(q)}&license=cc0&source=freesound&page_size=20&page=${page}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.ok) return r.json();
    if (r.status === 429) {
      if (r.headers.get("x-ratelimit-available-anon_sustained") === "0") {
        throw new Error("Openverse daily limit reached (200/day) — run the script again tomorrow, it continues where it stopped");
      }
      console.log(`\n  rate limit (burst), waiting 65 s… [${q} p${page}]`);
      await sleep(65_000);
      lastRequest = Date.now();
      continue;
    }
    console.log(`\n  Openverse ${r.status} for "${q}" page ${page} — skipped`);
    return { results: [], page_count: 0 };
  }
  return { results: [], page_count: 0 };
}

const slug = (s) => s.toLowerCase().replace(/\.(wav|mp3|flac|ogg|aif+)$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "sound";
const fsId = (r) => (r.url.match(/previews\/\d+\/(\d+)_/) || [])[1] || r.id;

mkdirSync(EXTRA, { recursive: true });
const manifestPath = join(EXTRA, "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { categories: {}, sounds: [] };
const have = new Set(manifest.sounds.map((s) => s.freesoundId));
const only = process.argv.slice(2);

for (const [key, cat] of Object.entries(CATEGORIES)) {
  if (only.length && !only.includes(key)) continue;
  manifest.categories[key] = cat.ru;
  let count = manifest.sounds.filter((s) => s.category === key).length;
  console.log(`\n== ${cat.ru}: have ${count}, want ${cat.want}`);
  outer: for (const q of cat.queries) {
    for (let page = 1; page <= 5 && count < cat.want; page++) {
      const j = await openverse(q, page);
      for (const r of j.results ?? []) {
        if (count >= cat.want) break outer;
        const id = fsId(r);
        if (have.has(id) || r.license !== "cc0" || r.mature) continue;
        if (!r.duration || r.duration < cat.minMs || r.duration > cat.maxMs) continue;
        const file = `${key}/fs-${id}-${slug(r.title)}.mp3`;
        const dst = join(EXTRA, file);
        mkdirSync(join(EXTRA, key), { recursive: true });
        try {
          const a = await fetch(r.url, { headers: { "User-Agent": UA } });
          if (!a.ok || !(a.headers.get("content-type") || "").includes("audio")) {
            console.log(`\n  download ${a.status} ${r.url} — skipped`);
            continue;
          }
          writeFileSync(dst, Buffer.from(await a.arrayBuffer()));
        } catch (e) {
          console.log(`\n  download error ${r.url}: ${e.cause?.code || e.message}`);
          continue;
        }
        have.add(id);
        count++;
        manifest.sounds.push({
          id: `${key}/fs-${id}-${slug(r.title)}`,
          category: key,
          file,
          freesoundId: id,
          title: r.title,
          creator: r.creator,
          license: "CC0",
          source: r.foreign_landing_url,
          dur_s: Math.round(r.duration / 100) / 10,
          tags: (r.tags || []).map((t) => t.name).slice(0, 8),
        });
        process.stdout.write(".");
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      if (!j.results?.length || page >= (j.page_count || 0)) break;
    }
  }
  console.log(` ${count}`);
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nTotal extra sounds: ${manifest.sounds.length} → ${manifestPath}`);
