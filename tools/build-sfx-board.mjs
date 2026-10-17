// Builds <REELS_HOME>/sfx-library/index.html — a local page to listen to the SFX library
// (kit/ = opus-sound-layer hits, extra/ = whole Freesound recordings), star favourites with
// "when to use" notes, and mark sounds for deletion (confirmed in a review list).
//
// Opened via the «Библиотека звуков» launcher (tools/sfx-board-server.mjs) the page saves straight to
// sfx-library/our-library.json and moves confirmed deletions to sfx-library/_deleted.
// Opened as a plain file it falls back to Chrome/Edge "Save as" or a download into Downloads.
// Every rebuild embeds the saved file, so the page always shows the saved state.
//
// Usage: node tools/build-sfx-board.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { LIB, PROJECT_SFX } from "./paths.mjs";

const catalog = JSON.parse(readFileSync(join(LIB, "kit", "catalog.json"), "utf8"));

const sounds = catalog.sounds.filter((s) => existsSync(join(LIB, "kit", s.file))).map((s) => ({
  id: s.id,
  type: s.type,
  src: `kit/${s.file}`,
  tags: s.tags.filter((t) => t !== s.type && t !== "kenney" && t !== "freesound").join(" "),
  dur: s.dur_s,
}));

// Effects already used in reels (Remotion's hosted meme SFX), for comparison
const ours = PROJECT_SFX;
if (existsSync(ours)) {
  for (const f of readdirSync(ours).filter((f) => f.endsWith(".wav"))) {
    sounds.unshift({
      id: `ours/${f.replace(/\.wav$/, "")}`,
      type: "ours",
      src: relative(LIB, join(ours, f)).split("\\").join("/"),
      tags: "remotion meme",
      dur: null,
    });
  }
}

// Whole CC0 recordings from Freesound (tools/fetch-openverse-sfx.mjs): backgrounds, typewriters, etc.
const extraManifestPath = join(LIB, "extra", "manifest.json");
const extra = existsSync(extraManifestPath) ? JSON.parse(readFileSync(extraManifestPath, "utf8")) : { categories: {}, sounds: [] };
for (const s of extra.sounds) {
  if (!existsSync(join(LIB, "extra", s.file))) continue;
  sounds.push({ id: s.id, type: s.category, src: `extra/${s.file}`, tags: [s.title, ...(s.tags || [])].join(" ").slice(0, 90), dur: s.dur_s });
}

const catalogTypes = Array.isArray(catalog.types) ? catalog.types : Object.keys(catalog.types ?? {});
const types = ["ours", ...Object.keys(extra.categories), ...catalogTypes.map((t) => (typeof t === "string" ? t : t.name ?? t.type))].filter(
  (t, i, a) => t && a.indexOf(t) === i && sounds.some((s) => s.type === t),
);

// Saved state: { favourites: { id: comment }, toDelete: [id] }
const savedPath = join(LIB, "our-library.json");
const saved = existsSync(savedPath) ? JSON.parse(readFileSync(savedPath, "utf8")) : {};
const known = new Set(sounds.map((s) => s.id));
const seed = {
  savedAt: saved.savedAt ?? "",
  favourites: Object.fromEntries(Object.entries(saved.favourites ?? {}).filter(([id]) => known.has(id))),
  toDelete: (saved.toDelete ?? []).filter((id) => known.has(id)),
};

const ru = {
  ours: "уже в рилсе", hit: "удар", boom: "бум", riser: "нарастание", reverse: "реверс",
  transition: "переход", whoosh: "вжух", swish: "свист", glitch: "глитч", ui: "интерфейс",
  click: "клик", key: "клавиша", tick: "тик", tap: "тап", pop: "поп", thump: "глухой удар",
  paper: "бумага", chime: "звон", shimmer: "мерцание", zap: "зап",
  ...extra.categories,
};

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Библиотека звуков</title>
<style>
  :root { --bg:#f6f3ee; --fg:#211c17; --muted:#6f665c; --card:#fff; --line:#e3ddd3; --accent:#1f7a6d; --star:#e0a100; --del:#c0392b; --ok:#2e7d32; }
  @media (prefers-color-scheme: dark) { :root { --bg:#16130f; --fg:#efe9e1; --muted:#a39a8e; --card:#221d18; --line:#352e27; --accent:#2a9d8f; --star:#ffc93c; --del:#ff6b5b; --ok:#7bd88f; } }
  * { box-sizing: border-box; }
  body { margin:0; font: 15px/1.4 system-ui, "Segoe UI", sans-serif; background:var(--bg); color:var(--fg); }
  header { position:sticky; top:0; z-index:2; background:var(--bg); border-bottom:1px solid var(--line); padding:14px 16px; }
  h1 { margin:0 0 4px; font-size:20px; }
  .hint { color:var(--muted); font-size:13px; margin:0 0 10px; max-width:900px; }
  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  input[type=search], input.note { padding:8px 10px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--fg); font:inherit; }
  input[type=search] { flex:1 1 220px; }
  button { font:inherit; border:1px solid var(--line); background:var(--card); color:var(--fg); border-radius:999px; padding:5px 12px; cursor:pointer; }
  button.on { background:var(--accent); border-color:var(--accent); color:#fff; }
  .chips { margin-top:8px; display:flex; flex-wrap:wrap; gap:6px; }
  main { padding:12px 16px 100px; display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:8px; }
  .s { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px 12px; display:grid; grid-template-columns: auto 1fr auto auto; gap:6px 10px; align-items:start; }
  .s.playing { outline:2px solid var(--accent); }
  .s.del { outline:2px dashed var(--del); opacity:.55; }
  .s.del .name { text-decoration: line-through; }
  .play { width:34px; height:34px; border-radius:50%; border:none; background:var(--accent); color:#fff; padding:0; }
  .meta { min-width:0; cursor:pointer; }
  .name { font-weight:600; overflow-wrap:anywhere; }
  .sub { color:var(--muted); font-size:12px; overflow-wrap:anywhere; }
  .icon { border:none; background:none; font-size:20px; padding:0 2px; color:var(--line); line-height:1; }
  .star.on { color:var(--star); }
  .bin.on { color:var(--del); }
  input.note { grid-column: 1 / -1; width:100%; font-size:13px; padding:6px 8px; }
  .bar { position:fixed; right:16px; bottom:16px; z-index:3; display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; align-items:center; }
  .bar button { border:none; padding:10px 16px; color:#fff; box-shadow:0 6px 18px rgba(0,0,0,.25); }
  #saveBtn { background:var(--accent); }
  #saveBtn.need { animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(31,122,109,.6); } 50% { box-shadow:0 0 0 10px rgba(31,122,109,0); } }
  #status.dirty { font-weight:600; }
  #delBtn { background:var(--del); }
  #status { background:var(--card); border:1px solid var(--line); border-radius:999px; padding:6px 12px; font-size:13px; color:var(--muted); }
  #status.ok { color:var(--ok); }
  #status.dirty { color:var(--del); }
  #count { color:var(--muted); font-size:13px; }
  dialog { border:1px solid var(--line); border-radius:12px; background:var(--card); color:var(--fg); width:min(560px, calc(100vw - 32px)); padding:18px; }
  dialog::backdrop { background:rgba(0,0,0,.45); }
  dialog h2 { margin:0 0 6px; font-size:18px; }
  .dl { max-height:55vh; overflow:auto; margin:10px 0; border-top:1px solid var(--line); }
  .dl label { display:flex; gap:10px; align-items:center; padding:8px 0; border-bottom:1px solid var(--line); }
  .dl .play { width:28px; height:28px; flex:none; }
  .actions { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
  .danger { background:var(--del); border-color:var(--del); color:#fff; }
</style>
</head>
<body>
<header>
  <h1>Библиотека звуков</h1>
  <p class="hint">Клик по карточке — проиграть. <b>★</b> — в нашу библиотеку (появится поле «когда использовать»). <b>🗑</b> — пометить на удаление; удаление срабатывает только после проверки списка и «Подтвердить». Открывайте страницу ярлыком <b>«Библиотека звуков.bat»</b> в C:\\Reels — тогда всё сразу сохраняется в <code>sfx-library\\our-library.json</code>, а подтверждённое удаление сразу переносит файлы в <code>_deleted</code>. Claude читает этот файл сам. Все звуки CC0 (Kenney, Freesound).</p>
  <div class="row">
    <input type="search" id="q" placeholder="Поиск по тегам и комментариям: metal, soft, мягкий…">
    <button id="onlyFav">Только ★</button>
    <button id="onlyDel">Только 🗑</button>
    <button id="markAll" title="Пометить на удаление всё, что сейчас показано (с учётом категории и поиска), кроме ★ и звуков «уже в рилсе»">🗑 Все показанные, кроме ★</button>
    <button id="unmarkAll">Снять пометки</button>
    <span id="count"></span>
  </div>
  <div class="chips" id="chips"></div>
</header>
<main id="list"></main>
<div class="bar">
  <span id="status">сохранено</span>
  <button id="delBtn">🗑 К удалению (0)</button>
  <button id="saveBtn">💾 Сохранить</button>
</div>

<dialog id="delDialog">
  <h2>Проверьте список на удаление</h2>
  <p class="hint">Снимите галочку со звуков, которые всё-таки оставить. Можно ещё раз прослушать. После подтверждения звуки пропадут со страницы, а Claude перенесёт их файлы в папку _deleted (оттуда можно вернуть).</p>
  <div class="dl" id="delList"></div>
  <div class="actions">
    <button id="delCancel">Отмена</button>
    <button id="delConfirm" class="danger">Подтвердить удаление</button>
  </div>
</dialog>

<script>
const SOUNDS = ${JSON.stringify(sounds)};
const TYPES = ${JSON.stringify(types)};
const RU = ${JSON.stringify(ru)};
const SEED = ${JSON.stringify(seed)};

// ---------- state ----------
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch (e) { return d; } };
const store = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
// Base = the newest of: the file embedded at build time (SEED) and the last successful save in this browser
const lastSaved = load("sfx-saved", null);
const base = !location.protocol.startsWith("http") && lastSaved && (!SEED.savedAt || lastSaved.savedAt > SEED.savedAt) ? lastSaved : SEED;
// Draft = full unsaved state in this browser (wins over base)
let draft = load("sfx-draft", null);
if (!draft) {
  const oldFavs = Object.assign({}, ...load("sfx-favs", []).map(id => ({ [id]: "" })), load("sfx-favs-v2", {}));
  const oldDels = load("sfx-dels", []);
  if (Object.keys(oldFavs).length || oldDels.length) {
    draft = { favourites: Object.assign({}, base.favourites || {}, oldFavs), toDelete: base.toDelete || [], marked: oldDels, unsaved: true };
    store("sfx-draft", draft);
  }
}
const cur = draft || base;
const favs = Object.assign({}, cur.favourites || {});    // id -> comment
const confirmed = new Set(cur.toDelete || []);           // confirmed deletions
const marked = new Set((draft && draft.marked) || []);   // 🗑, not yet confirmed (never written to the file)
let dirty = !!(draft && draft.unsaved);

const snapshot = (unsaved) => ({ favourites: favs, toDelete: [...confirmed].sort(), marked: [...marked], unsaved });
function changed() {
  dirty = true;
  store("sfx-draft", snapshot(true));
  setStatus("не сохранено", "dirty");
  scheduleAutoSave();
}
const keepMarks = () => store("sfx-draft", snapshot(dirty));

// ---------- saving to disk ----------
let fileHandle = null;
const DB = "sfx-board", STORE = "handles";
// Remembers the chosen file between visits; never allowed to block saving (1.5 s timeout)
function idb(mode, fn) {
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("idb timeout")), 1500));
  return Promise.race([timeout, idbRaw(mode, fn)]);
}
function idbRaw(mode, fn) {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => { const tx = r.result.transaction(STORE, mode); const q = fn(tx.objectStore(STORE)); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); };
    r.onerror = () => rej(r.error);
  });
}
const LIVE = location.protocol.startsWith("http");
const api = (path, body) => fetch(path, { method: "POST", headers: { "Content-Type": "application/json", "X-SFX-Board": "1" }, body: JSON.stringify(body) })
  .then(r => r.ok ? r.json() : r.json().then(j => Promise.reject(new Error(j.error || r.status))));
const canPick = !LIVE && "showSaveFilePicker" in window;
(async () => { try { fileHandle = await idb("readonly", s => s.get("file")) || null; } catch (e) {} })();

let savedAtStamp = "";
function fileJson() {
  savedAtStamp = new Date().toISOString();
  return JSON.stringify({
    note: "Saved by C:\\\\Reels\\\\sfx-library\\\\index.html. favourites: id -> when to use; toDelete: confirmed by the user, Claude moves them to _deleted.",
    savedAt: savedAtStamp,
    favourites: Object.fromEntries(Object.keys(favs).sort().map(k => [k, favs[k]])),
    toDelete: [...confirmed].sort(),
  }, null, 2) + "\\n";
}

async function save(interactive) {
  const text = fileJson();
  if (LIVE) {
    try {
      const r = await api("/api/save", JSON.parse(text));
      dirty = false;
      store("sfx-saved", { favourites: favs, toDelete: [...confirmed].sort(), savedAt: r.savedAt });
      store("sfx-draft", marked.size ? snapshot(false) : null);
      setStatus("✓ сохранено в our-library.json", "ok");
      document.getElementById("saveBtn").classList.remove("need");
      return true;
    } catch (e) { setStatus("⚠ помощник не отвечает — запустите «Библиотека звуков.bat»", "dirty"); return false; }
  }
  try {
    if (canPick) {
      if (!fileHandle) {
        if (!interactive) return false;
        fileHandle = await window.showSaveFilePicker({ suggestedName: "our-library.json", types: [{ description: "JSON", accept: { "application/json": [".json"] } }] });
        try { await idb("readwrite", s => s.put(fileHandle, "file")); } catch (e) {}
      }
      let perm = await fileHandle.queryPermission({ mode: "readwrite" });
      if (perm !== "granted") {
        if (!interactive) return false;
        perm = await fileHandle.requestPermission({ mode: "readwrite" });
        if (perm !== "granted") return false;
      }
      const w = await fileHandle.createWritable(); await w.write(text); await w.close();
      setStatus("✓ сохранено в " + fileHandle.name, "ok");
      document.getElementById("saveBtn").classList.remove("need");
    } else {
      if (!interactive) return false;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      a.download = "our-library.json"; a.click(); URL.revokeObjectURL(a.href);
      setStatus("✓ скачано в «Загрузки»", "ok");
      document.getElementById("saveBtn").classList.remove("need");
    }
    dirty = false;
    store("sfx-saved", { favourites: favs, toDelete: [...confirmed].sort(), savedAt: savedAtStamp });
    store("sfx-draft", marked.size ? snapshot(false) : null);
    return true;
  } catch (e) {
    if (e && e.name === "AbortError") { setStatus("не сохранено", "dirty"); return false; }
    setStatus("ошибка сохранения: " + (e && e.message || e), "dirty"); return false;
  }
}
let autoTimer = null;
function needManualSave() {
  setStatus("⚠ не сохранено в файл — нажмите «💾 Сохранить»", "dirty");
  document.getElementById("saveBtn").classList.add("need");
}
function scheduleAutoSave() {
  clearTimeout(autoTimer);
  autoTimer = setTimeout(async () => { if (!(await save(false)) && dirty) needManualSave(); }, 800);
}
// Can we write without asking? (file chosen before and permission still granted)
async function canWriteSilently() {
  if (LIVE) return true;
  if (!canPick || !fileHandle) return false;
  try { return (await fileHandle.queryPermission({ mode: "readwrite" })) === "granted"; } catch (e) { return false; }
}
function setStatus(t, cls) { const s = document.getElementById("status"); s.textContent = t; s.className = cls || ""; }
document.getElementById("saveBtn").onclick = () => save(true);
window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

// ---------- UI ----------
let type = "ours", onlyFav = false, onlyDel = false, q = "";
const audio = new Audio();
let playingEl = null;
const byId = Object.fromEntries(SOUNDS.map(s => [s.id, s]));
const play = (s, el) => {
  audio.pause(); audio.src = s.src; audio.currentTime = 0; audio.play();
  if (playingEl) playingEl.classList.remove("playing");
  if (el) { el.classList.add("playing"); playingEl = el; }
};
audio.onended = () => { if (playingEl) playingEl.classList.remove("playing"); };

const chips = document.getElementById("chips");
for (const t of ["all", ...TYPES]) {
  const b = document.createElement("button");
  b.textContent = t === "all" ? "все" : (RU[t] || t) + " · " + SOUNDS.filter(s => s.type === t).length;
  b.dataset.t = t;
  b.onclick = () => { type = t; render(); };
  chips.appendChild(b);
}
document.getElementById("q").oninput = (e) => { q = e.target.value.toLowerCase(); render(); };
document.getElementById("onlyFav").onclick = (e) => { onlyFav = !onlyFav; e.target.classList.toggle("on", onlyFav); render(); };
document.getElementById("onlyDel").onclick = (e) => { onlyDel = !onlyDel; e.target.classList.toggle("on", onlyDel); render(); };
function updateBar() { document.getElementById("delBtn").textContent = "🗑 К удалению (" + marked.size + ")"; }

// Bulk marking: everything currently shown, except favourites and sounds already used in reels
document.getElementById("markAll").onclick = () => {
  const targets = visible().filter(s => !(s.id in favs) && s.type !== "ours" && !marked.has(s.id));
  if (!targets.length) { alert("Нечего помечать: все показанные звуки уже помечены или в ★"); return; }
  const scope = type === "all" ? "во всех категориях" : "в категории «" + (RU[type] || type) + "»";
  if (!confirm("Пометить на удаление " + targets.length + " звуков " + scope + (q ? " (с учётом поиска)" : "") + "?\\n★ и «уже в рилсе» не трогаются. Удалятся они только после проверки списка и «Подтвердить».")) return;
  for (const s of targets) marked.add(s.id);
  keepMarks(); render();
};
document.getElementById("unmarkAll").onclick = () => {
  if (!marked.size) return;
  if (!confirm("Снять все " + marked.size + " пометок на удаление?")) return;
  marked.clear(); keepMarks(); render();
};

// Deletion: review dialog with checkboxes, then confirm → saved to the file
const dlg = document.getElementById("delDialog");
document.getElementById("delBtn").onclick = () => {
  if (!marked.size) { alert("Пока ничего не помечено 🗑"); return; }
  const list = document.getElementById("delList");
  list.innerHTML = "";
  for (const id of [...marked].sort()) {
    const s = byId[id]; if (!s) continue;
    const row = document.createElement("label");
    row.innerHTML = '<input type="checkbox" checked><button class="play" type="button">▶</button><span></span>';
    row.querySelector("span").textContent = id;
    row.querySelector("input").dataset.id = id;
    row.querySelector("button").onclick = (e) => { e.preventDefault(); play(s); };
    list.appendChild(row);
  }
  dlg.showModal();
};
document.getElementById("delCancel").onclick = () => dlg.close();
document.getElementById("delConfirm").onclick = async () => {
  const boxes = [...document.querySelectorAll("#delList input")];
  for (const b of boxes) { marked.delete(b.dataset.id); if (b.checked) { confirmed.add(b.dataset.id); delete favs[b.dataset.id]; } }
  dlg.close();
  changed(); render();
  const ok = await save(true);
  if (LIVE && ok && confirmed.size) {
    try {
      const r = await api("/api/delete", { ids: [...confirmed] });
      confirmed.clear(); store("sfx-saved", null); store("sfx-draft", marked.size ? snapshot(false) : null);
      alert("Перенесено в _deleted: " + r.moved + " звуков. Страница обновится.");
      location.reload();
    } catch (e) { setStatus("⚠ не удалось перенести файлы: " + e.message, "dirty"); }
  }
};

const visible = () => SOUNDS.filter(s => !confirmed.has(s.id) && (type === "all" || s.type === type) &&
  (!onlyFav || s.id in favs) && (!onlyDel || marked.has(s.id)) &&
  (!q || (s.id + " " + s.tags + " " + (favs[s.id] || "")).toLowerCase().includes(q)));

function render() {
  for (const b of chips.children) b.classList.toggle("on", b.dataset.t === type);
  const items = visible();
  document.getElementById("count").textContent = items.length + " шт." + (items.length > 400 ? " (показаны первые 400)" : "") + (confirmed.size ? " · удалено: " + confirmed.size : "");
  const list = document.getElementById("list");
  list.innerHTML = "";
  for (const s of items.slice(0, 400)) {
    const el = document.createElement("div");
    el.className = "s" + (marked.has(s.id) ? " del" : "");
    el.innerHTML = '<button class="play" aria-label="Проиграть">▶</button>' +
      '<div class="meta"><div class="name"></div><div class="sub"></div></div>' +
      '<button class="icon star" title="В нашу библиотеку">★</button>' +
      '<button class="icon bin" title="Пометить на удаление">🗑</button>';
    el.querySelector(".name").textContent = s.id.split("/").pop();
    el.querySelector(".sub").textContent = (RU[s.type] || s.type) + (s.dur ? " · " + s.dur.toFixed(2) + " с" : "") + (s.tags ? " · " + s.tags : "");
    const star = el.querySelector(".star"), bin = el.querySelector(".bin");
    if (s.type === "ours") bin.style.visibility = "hidden";   // used by the reel project — never delete from here
    star.classList.toggle("on", s.id in favs);
    bin.classList.toggle("on", marked.has(s.id));
    const addNote = () => {
      if (!(s.id in favs) || el.querySelector(".note")) return;
      const inp = document.createElement("input");
      inp.className = "note";
      inp.placeholder = "Когда использовать? Например: мягкий клик — появление подписи";
      inp.value = favs[s.id] || "";
      inp.oninput = () => { favs[s.id] = inp.value; changed(); };
      inp.onclick = (e) => e.stopPropagation();
      el.appendChild(inp);
    };
    star.onclick = async (e) => {
      e.stopPropagation();
      if (s.id in favs) { delete favs[s.id]; el.querySelector(".note")?.remove(); }
      else { favs[s.id] = ""; marked.delete(s.id); el.classList.remove("del"); bin.classList.remove("on"); addNote(); el.querySelector(".note")?.focus(); }
      star.classList.toggle("on", s.id in favs); updateBar(); changed();
      if (!(await canWriteSilently())) { clearTimeout(autoTimer); if (!(await save(true))) needManualSave(); }
    };
    bin.onclick = (e) => {
      e.stopPropagation();
      if (marked.has(s.id)) marked.delete(s.id);
      else { marked.add(s.id); el.querySelector(".note")?.remove(); star.classList.remove("on"); if (s.id in favs) { delete favs[s.id]; changed(); } }
      el.classList.toggle("del", marked.has(s.id)); bin.classList.toggle("on", marked.has(s.id)); updateBar();
      keepMarks();
    };
    el.querySelector(".play").onclick = () => play(s, el);
    el.querySelector(".meta").onclick = () => play(s, el);
    addNote();
    list.appendChild(el);
  }
  updateBar();
}
if (dirty) needManualSave();
render();
</script>
</body>
</html>
`;

writeFileSync(join(LIB, "index.html"), html);
console.log(
  `index.html: ${sounds.length} sounds, ${types.length} types, ` +
    `${Object.keys(seed.favourites).length} saved favourites, ${seed.toDelete.length} pending deletions`,
);
