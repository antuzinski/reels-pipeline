// Normalises a rendered reel to the social-media loudness standard (two-pass EBU R128 loudnorm).
// Default: −14 LUFS integrated, −1.5 dBTP true peak (Instagram / TikTok / YouTube).
// Video is copied untouched; audio is re-encoded to AAC 192k. Needs the system FFmpeg (full build).
//
// Usage: node scripts/loudness.mjs <in.mp4> <out.mp4> [--target -14] [--tp -1.5]
import { spawnSync } from "node:child_process";

const [input, output, ...rest] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: loudness.mjs <in.mp4> <out.mp4> [--target -14] [--tp -1.5]");
const opt = { target: -14, tp: -1.5, lra: 11 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = Number(rest[i + 1]);

const ff = (args) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(r.stderr.slice(-2000));
  return r.stderr;
};
const measure = (file) => {
  const log = ff(["-i", file, "-af", `loudnorm=I=${opt.target}:TP=${opt.tp}:LRA=${opt.lra}:print_format=json`, "-f", "null", "-"]);
  return JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
};

const m = measure(input);
console.log(`before: ${m.input_i} LUFS, true peak ${m.input_tp} dBTP, LRA ${m.input_lra}`);
const filter =
  `loudnorm=I=${opt.target}:TP=${opt.tp}:LRA=${opt.lra}` +
  `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}` +
  `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
ff(["-y", "-i", input, "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy", "-af", filter, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output]);
const after = measure(output);
console.log(`after:  ${after.input_i} LUFS, true peak ${after.input_tp} dBTP → ${output}`);
