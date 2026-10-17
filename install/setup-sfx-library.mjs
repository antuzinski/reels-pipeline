// Sets up the sound library in <REELS_HOME>/sfx-library:
//   1. kit/   — opus-sound-layer CC0 kit (Kenney + Freesound hits, ~1100 sounds, ~220 MB)
//   2. extra/ — whole CC0 recordings from Freesound via Openverse (~320 files, ~100 MB)
//   3. favorites-pack/ — the curated favourites shipped with the repo (copied over, so ★ + comments work at once)
//   4. builds sfx-library/index.html
// Needs: git, uv, ffmpeg on PATH. Safe to re-run (skips what is already there).
// Usage: node install/setup-sfx-library.mjs [--skip-kit] [--skip-extra]
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, LIB, KIT, EXTRA } from "../tools/paths.mjs";

const args = new Set(process.argv.slice(2));
const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { stdio: "inherit", ...opts });
const has = (cmd) => {
  try { execFileSync(cmd, [cmd === "ffmpeg" ? "-version" : "--version"], { stdio: "ignore" }); return true; }
  catch { return false; }
};

for (const c of ["git", "uv", "ffmpeg"]) {
  if (!has(c)) { console.error(`✗ ${c} not found on PATH — see INSTALL.md, step 1`); process.exit(1); }
}
mkdirSync(LIB, { recursive: true });

// 1. opus-sound-layer kit
const opus = join(ROOT, "tools", "opus-sound-layer");
if (!args.has("--skip-kit")) {
  if (!existsSync(opus)) run("git", ["clone", "--depth", "1", "https://github.com/Bodila51/opus-sound-layer", opus]);
  if (existsSync(join(KIT, "catalog.json"))) console.log("✓ kit already downloaded");
  else {
    console.log("↓ downloading the CC0 kit (several minutes)…");
    run("uv", ["run", "scripts/sfx.py", "kit", "--out", KIT], { cwd: opus });
  }
}

// 2. Whole recordings (resumes: already downloaded ones are skipped)
if (!args.has("--skip-extra")) {
  console.log("↓ downloading whole recordings from Freesound (Openverse, throttled to 20 requests/min)…");
  run(process.execPath, [join(ROOT, "tools", "fetch-openverse-sfx.mjs")]);
}

// 3. Curated favourites shipped with the repo
const pack = join(LIB, "favorites-pack");
if (existsSync(pack)) {
  for (const sub of ["kit", "extra"]) if (existsSync(join(pack, sub))) cpSync(join(pack, sub), join(LIB, sub), { recursive: true, force: false, errorOnExist: false });
  const entriesPath = join(pack, "extra-entries.json");
  if (existsSync(entriesPath)) {
    const entries = JSON.parse(readFileSync(entriesPath, "utf8"));
    const manifestPath = join(EXTRA, "manifest.json");
    const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { categories: {}, sounds: [] };
    for (const e of entries) if (!manifest.sounds.some((s) => s.id === e.id)) manifest.sounds.push(e);
    mkdirSync(EXTRA, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }
  // Favourites from the kit must be listed in kit/catalog.json to show up
  const catPath = join(KIT, "catalog.json");
  if (existsSync(catPath)) {
    const catalog = JSON.parse(readFileSync(catPath, "utf8"));
    const saved = existsSync(join(LIB, "our-library.json")) ? JSON.parse(readFileSync(join(LIB, "our-library.json"), "utf8")) : {};
    for (const id of Object.keys(saved.favourites ?? {})) {
      const sidecar = join(KIT, id + ".json");
      if (catalog.sounds.some((s) => s.id === id) || !existsSync(sidecar)) continue;
      const meta = JSON.parse(readFileSync(sidecar, "utf8"));
      catalog.sounds.push({ id, type: id.split("/")[0], file: id + ".wav", tags: meta.tags ?? [], credit: meta.credit ?? "", dur_s: meta.dur_s ?? null, ...meta, id });
    }
    writeFileSync(catPath, JSON.stringify(catalog, null, 2) + "\n");
  }
  console.log("✓ curated favourites in place");
}

// 4. Page
if (existsSync(join(KIT, "catalog.json"))) run(process.execPath, [join(ROOT, "tools", "build-sfx-board.mjs")]);
console.log("\nDone. Open the library with «Библиотека звуков.bat» (Windows) or «Библиотека звуков.command» (macOS).");
