// Builds a cut list (segments to keep) from word-level captions.
// Remove retakes / off-topic words from the captions JSON first: the time holes they leave become cuts.
// Pauses longer than --gap are cut too; each segment keeps --pad of air around speech.
//
// Usage: node scripts/make-cuts.mjs <words.json> <segments.json> [--gap 450] [--pad 120] [--min 500] [--from ms] [--to ms]
// Output: [{ "fromMs": 24280, "toMs": 27120 }, ...] — times relative to the source file.
import { readFileSync, writeFileSync } from "node:fs";

const [src, out, ...rest] = process.argv.slice(2);
const opt = { gap: 450, pad: 120, min: 500, from: 0, to: Infinity };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = Number(rest[i + 1]);

const words = JSON.parse(readFileSync(src, "utf8"))
  .filter((w) => w.text.trim() && w.startMs >= opt.from && w.endMs <= opt.to)
  .sort((a, b) => a.startMs - b.startMs);
if (!words.length) throw new Error("no words in range");

const segments = [];
let start = words[0].startMs;
let end = words[0].endMs;
for (const w of words.slice(1)) {
  if (w.startMs - end > opt.gap) {
    segments.push({ fromMs: start - opt.pad, toMs: end + opt.pad });
    start = w.startMs;
  }
  end = Math.max(end, w.endMs);
}
segments.push({ fromMs: start - opt.pad, toMs: end + opt.pad });

// Merge segments that would be shorter than --min into their neighbour (avoids flicker cuts)
const merged = [];
for (const s of segments.map((s) => ({ fromMs: Math.max(0, Math.round(s.fromMs)), toMs: Math.round(s.toMs) }))) {
  const prev = merged[merged.length - 1];
  if (prev && (s.toMs - s.fromMs < opt.min || prev.toMs - prev.fromMs < opt.min)) prev.toMs = s.toMs;
  else merged.push(s);
}

writeFileSync(out, JSON.stringify(merged, null, 2) + "\n");
const kept = merged.reduce((a, s) => a + s.toMs - s.fromMs, 0);
const span = merged.at(-1).toMs - merged[0].fromMs;
console.log(`${merged.length} segments, ${(kept / 1000).toFixed(1)} s kept of ${(span / 1000).toFixed(1)} s (${((1 - kept / span) * 100).toFixed(0)}% cut)`);
