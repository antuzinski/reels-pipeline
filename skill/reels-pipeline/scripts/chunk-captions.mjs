// Splits word-level captions into short reel-style phrases by setting pageBreakAfter.
// Usage: node scripts/chunk-captions.mjs <clean.json> <chunked.json> [overrides.json]
// overrides.json (optional): { "forceBreakAfter": [startMs, ...], "noBreakAfter": [startMs, ...] }
import { readFileSync, writeFileSync } from "node:fs";

const [src, out, overridesPath] = process.argv.slice(2);
const raw = JSON.parse(readFileSync(src, "utf8")).map((w) => {
  const { pageBreakAfter, ...rest } = w;
  return rest;
});

// Merge tokens without a leading space (e.g. "»," or "-таки") into the previous word
const words = [];
for (const w of raw) {
  const prev = words[words.length - 1];
  if (prev && !w.text.startsWith(" ")) {
    prev.text += w.text;
    prev.endMs = w.endMs;
  } else {
    words.push({ ...w });
  }
}

const MAX_CHARS = 22; // soft limit, ~2 short lines
const HARD_CHARS = 36; // never exceed, even if the phrase would end on a glue word
const MAX_MS = 2200;
const MIN_MS = 700;

// A phrase should not end on these words: they belong to what follows
const glue = new Set([
  "а", "и", "но", "в", "во", "на", "с", "со", "к", "ко", "по", "под", "не",
  "что", "из", "за", "до", "от", "у", "о", "об", "это", "то", "как", "так",
  "же", "был", "была", "были", "тот", "чья", "нам", "сих", "вся", "эта",
  "джон", "джоном", "перси", "мэри", "вообще", "который", "известный",
  "потому", "точки", "мы",
]);

const bare = (t) => t.trim().toLowerCase();
const endsSentence = (t) => /[.?!…»]$/.test(t.trim()) && /[.?!…]/.test(t.trim());
const endsClause = (t) => /[,;:—]$/.test(t.trim()) || t.trim() === "—";
const hasPunct = (t) => /[,;:.?!…—»]$/.test(t.trim());
const isNumber = (t) => /^\d+$/.test(t.trim());
// Adjectives / pronouns in agreeing forms usually lean on the next noun
const isAdjective = (t) =>
  !hasPunct(t) && /(ого|его|ому|ему|ых|их|ый|ий|ой|ей|ую|юю)$/.test(bare(t));

const canEndOn = (w) =>
  !glue.has(bare(w.text)) && !isNumber(w.text) && !isAdjective(w.text);

let page = [];
const flush = () => {
  if (page.length) page[page.length - 1].pageBreakAfter = true;
  page = [];
};

for (let i = 0; i < words.length; i++) {
  const w = words[i];
  const next = words[i + 1];
  page.push(w);

  if (endsSentence(w.text) || next === undefined) {
    flush();
    continue;
  }

  const text = page.map((p) => p.text).join("").trim();
  const withNext = `${text}${next.text}`;
  const duration = w.endMs - page[0].startMs;

  // Keep a sentence-final word with its phrase instead of leaving it alone
  if (endsSentence(next.text) && withNext.length <= HARD_CHARS) continue;

  if (!canEndOn(w)) {
    if (withNext.length > HARD_CHARS) {
      // Too long: break at the last good point earlier in this page instead
      let j = page.length - 2;
      while (j >= 0 && !canEndOn(page[j])) j--;
      if (j >= 0) {
        page[j].pageBreakAfter = true;
        page = page.slice(j + 1);
      } else {
        flush();
      }
    }
    continue;
  }

  const pauseAfter = next.startMs - w.endMs;
  if (
    endsClause(w.text) &&
    page.length >= 2 &&
    (duration >= MIN_MS || pauseAfter >= 300 || withNext.length > HARD_CHARS)
  ) {
    flush();
  } else if (duration < MIN_MS && withNext.length <= HARD_CHARS) {
    continue; // too short to read, keep going
  } else if (withNext.length > MAX_CHARS || duration > MAX_MS) {
    flush();
  }
}
flush();

// Manual per-video fixes, keyed by word startMs
const overrides = overridesPath ? JSON.parse(readFileSync(overridesPath, "utf8")) : {};
const forceBreakAfter = new Set(overrides.forceBreakAfter ?? []);
const noBreakAfter = new Set(overrides.noBreakAfter ?? []);
for (const w of words) {
  if (forceBreakAfter.has(w.startMs)) w.pageBreakAfter = true;
  if (noBreakAfter.has(w.startMs)) delete w.pageBreakAfter;
}

writeFileSync(out, JSON.stringify(words, null, 2));

// Preview
let line = "";
for (const w of words) {
  line += w.text;
  if (w.pageBreakAfter) {
    console.log(`${(w.endMs / 1000).toFixed(1).padStart(6)} | ${line.trim()}`);
    line = "";
  }
}
