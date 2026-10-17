// Local helper for the SFX library page: serves it and writes choices straight to disk.
// Start with the «Библиотека звуков» launcher (.bat on Windows, .command on macOS). Close the window to stop.
//
//   GET  /sfx-library/...          page + sounds (and /first-reel/public/sfx/* used by "уже в рилсе")
//   POST /api/save    {favourites, toDelete}  → sfx-library/our-library.json
//   POST /api/delete  {ids}                   → moves files to sfx-library/_deleted/<type>/,
//                                               drops them from kit/catalog.json, rebuilds the page
// Listens on 127.0.0.1 only; API calls must carry the X-SFX-Board header (blocks cross-site requests).
import { createServer } from "node:http";
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, statSync, createReadStream } from "node:fs";
import { join, normalize, dirname, extname, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, LIB, KIT, SAVED, PROJECT_SFX, openUrl } from "./paths.mjs";

const PORT = 8765;
const ALLOWED = [LIB + sep, PROJECT_SFX + sep];
const MIME = { ".html": "text/html; charset=utf-8", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".json": "application/json" };

const rebuild = () => execFileSync(process.execPath, [join(ROOT, "tools", "build-sfx-board.mjs")], { stdio: "inherit" });

function writeJsonAtomic(path, data) {
  writeFileSync(path + ".tmp", JSON.stringify(data, null, 2) + "\n");
  renameSync(path + ".tmp", path);
}
const readBody = (req) =>
  new Promise((res, rej) => {
    let b = "";
    req.on("data", (c) => { b += c; if (b.length > 5e6) rej(new Error("too large")); });
    req.on("end", () => { try { res(JSON.parse(b || "{}")); } catch (e) { rej(e); } });
  });
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

// Two sources: kit/ (opus-sound-layer, kit/catalog.json) and extra/ (Freesound recordings, extra/manifest.json)
const SOURCES = [
  { dir: KIT, index: join(KIT, "catalog.json"), sidecar: (f) => f.replace(/\.wav$/, ".json") },
  { dir: join(LIB, "extra"), index: join(LIB, "extra", "manifest.json"), sidecar: null },
];

function moveToDeleted(ids) {
  const want = new Set(ids);
  const moved = [];
  for (const src of SOURCES) {
    if (!existsSync(src.index)) continue;
    const index = JSON.parse(readFileSync(src.index, "utf8"));
    const goneHere = new Set();
    for (const s of index.sounds) {
      if (!want.has(s.id)) continue; // unknown or "ours/*" — never touched
      const from = normalize(join(src.dir, s.file));
      if (!from.startsWith(src.dir + sep)) continue;
      const to = join(LIB, "_deleted", s.file);
      mkdirSync(dirname(to), { recursive: true });
      if (existsSync(from)) renameSync(from, to);
      if (src.sidecar && existsSync(src.sidecar(from))) renameSync(src.sidecar(from), src.sidecar(to));
      goneHere.add(s.id);
      moved.push(s.id);
    }
    if (goneHere.size) {
      index.sounds = index.sounds.filter((s) => !goneHere.has(s.id));
      writeJsonAtomic(src.index, index);
    }
  }
  if (moved.length) {
    const gone = new Set(moved);
    const saved = existsSync(SAVED) ? JSON.parse(readFileSync(SAVED, "utf8")) : {};
    saved.toDelete = (saved.toDelete ?? []).filter((id) => !gone.has(id));
    for (const id of moved) delete (saved.favourites ?? {})[id];
    saved.deleted = [...(saved.deleted ?? []), ...moved.map((id) => ({ id, at: new Date().toISOString() }))];
    writeJsonAtomic(SAVED, saved);
  }
  return moved;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname.startsWith("/api/")) {
      if (req.method !== "POST" || req.headers["x-sfx-board"] !== "1") return send(res, 403, { error: "forbidden" });
      const body = await readBody(req);
      if (url.pathname === "/api/save") {
        const prev = existsSync(SAVED) ? JSON.parse(readFileSync(SAVED, "utf8")) : {};
        const data = {
          note: "Saved by the SFX library page. favourites: id -> when to use; toDelete: confirmed, not yet moved; deleted: moved to _deleted.",
          savedAt: new Date().toISOString(),
          favourites: body.favourites ?? {},
          toDelete: body.toDelete ?? [],
          deleted: prev.deleted ?? [],
        };
        writeJsonAtomic(SAVED, data);
        return send(res, 200, { ok: true, savedAt: data.savedAt, path: SAVED });
      }
      if (url.pathname === "/api/delete") {
        const moved = moveToDeleted(Array.isArray(body.ids) ? body.ids : []);
        rebuild();
        return send(res, 200, { ok: true, moved: moved.length });
      }
      return send(res, 404, { error: "unknown api" });
    }
    if (url.pathname === "/" ) { res.writeHead(302, { Location: "/sfx-library/index.html" }); return res.end(); }
    if (url.pathname === "/api-ping") return send(res, 200, { ok: true });
    const file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (!ALLOWED.some((p) => file.startsWith(p)) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404); return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(file).pipe(res);
  } catch (e) {
    send(res, 500, { error: String(e && e.message || e) });
  }
});

rebuild();
server.listen(PORT, "127.0.0.1", () => {
  const page = `http://127.0.0.1:${PORT}/sfx-library/index.html`;
  console.log(`\nБиблиотека звуков: ${page}\nВыбор сохраняется в ${SAVED}\nЗакройте это окно, когда закончите.\n`);
  if (!process.argv.includes("--no-open")) openUrl(page);
});
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log("Помощник уже запущен — открываю страницу.");
    openUrl(`http://127.0.0.1:${PORT}/sfx-library/index.html`);
    setTimeout(() => process.exit(0), 500);
  } else throw e;
});
