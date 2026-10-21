---
name: reels-pipeline
description: Edit a talking-head phone recording into a vertical Instagram Reel with Remotion — transcribe (Whisper), cut to the on-topic part, crop to 9:16, phrase-level captions, meme/historical graphics, light SFX, render and self-review. Use when the user asks to make, cut, caption or decorate a reel/shorts from their own footage (e.g. IMG_*.MOV), or to continue such a reel.
---

# Reels pipeline (Remotion)

**REELS_HOME** = the workspace folder that holds `tools/`, `sfx-library/` and the Remotion project(s): `C:\Reels` on Windows, `~/Reels` on macOS (override with the `REELS_HOME` env var). Set up from https://github.com/antuzinski/reels-pipeline (INSTALL.md).

Proven on the "Frankenstein" reel (`REELS_HOME/first-reel`, composition `Frankenstein`; scene list in the repo's `examples/frankenstein`). Its components are examples made for that one story: do not reuse one unless the new line is literally about what it shows (see style.md, "Content first").
Also load the Remotion skills (`remotion-best-practices` → markup, captions, render) for API details.

Read before starting:
- [references/style.md](references/style.md) — the author's taste: what looked cheap, what worked. Follow it by default.
- [references/tools.md](references/tools.md) — tools, Windows/macOS install commands, tools kept "on the shelf".
- [references/background.md](references/background.md) — background replacement: matting in Studio, modnet vs ben2-base, 12 background variants, VFR/alpha pitfalls.
- [references/shooting-and-cuts.md](references/shooting-and-cuts.md) — how to shoot (vertical 4K, light, sound, retakes with a pause) and how cuts, punch-ins, push-ins, key words and loudness are done.

## Workflow

Work in small approved steps (Pasha Molyanov / Нейроцех method): agree on a fragment, show **stills** of each scene (`npx remotion render <Comp> <dir> --frames=a,b,c --scale=0.5`), only then animate and render the whole reel.

1. **Project.** Use the existing Remotion project if there is one; otherwise `npx create-video@latest --yes --blank --no-tailwind <name>` inside REELS_HOME, then `npx remotion add @remotion/media @remotion/captions @remotion/transitions @remotion/google-fonts`. Raw footage goes in `REELS_HOME/footage/` — **not** in `public/`: Remotion copies the whole `public/` folder into a temp bundle on every render, so multi-GB MOVs there fill the disk (ENOSPC) and slow renders. Only the working proxies go in `public/`. Studio launcher in REELS_HOME: `Открыть студию.bat` (Windows) / `Открыть студию.command` (macOS).
2. **Probe footage**: `ffprobe -show_entries stream=codec_name,width,height,r_frame_rate:stream_side_data=rotation`. iPhone MOVs are usually H.264 4K 30 fps (newer ones HEVC — re-encode the proxy to H.264); some are rotated.
3. **Transcribe**: `node scripts/transcribe.mts public/X.MOV captions/X.json [language]` (copy from this skill's `scripts/`; needs `npx remotion add @remotion/whisper-webgpu @huggingface/transformers mediabunny @mediabunny/server`). First run downloads ~3 GB model. Timestamps stay relative to the source file. On Apple Silicon `mlx-whisper` is a faster alternative (convert its words to the same Caption JSON).
4. **Clean the transcript**:
   - Chunk-overlap duplicates: a word whose `startMs` is earlier than the previous word's start means Whisper repeated a stretch — drop the duplicate block (keep the later, complete one).
   - Fix misrecognitions (names, idioms: «под орех», «вполне себе»).
   - Find the on-topic start/end phrases the user names; print the transcript grouped into timed sentences and **show it to the user** with suspected off-topic inserts before cutting.
5. **Proxy with zoom headroom** — vertical 4K: `scale=1350:2400` (1.25× headroom for punch-in/push-in); horizontal 4K: native 9:16 crop without downscaling (`crop=1215:2160:<x>:0`, 1.125×). Previous rule, still valid when no zooms are planned —
   **Vertical proxy** (rendering straight from 4K crashes the headless browser): the user marks a rectangle on a screenshot; centre a 9:16 full-height crop on it (for 3840×2160 the crop is 1215 px wide):
   `ffmpeg -i public/X.MOV -map 0:v:0 -map 0:a:0 -vf "crop=1215:2160:<x>:0,scale=1080:1920:flags=lanczos" -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -c:a copy -movflags +faststart public/X_vertical.mp4`
   Keep full length so caption timestamps still match. Check gesturing frames — hands must stay in frame.
5b. **Cuts** (several takes / pauses): remove retake and off-topic words from `X.clean.json` (keep the last clean take; show the user), then `node scripts/make-cuts.mjs captions/X.clean.json captions/X.segments.json --gap 450 --pad 120 --min 500`. Render with `components/TalkingHead.tsx` (`segments`, `punchIn` 1.1 on every other segment, `pushIn` 0.03, `focusX/focusY` = face point in %); composition length = `segmentsDurationInFrames(segments, fps)`. Graphics `from` values are then in **edited** time, not source time.
6. **Captions**: `node scripts/chunk-captions.mjs captions/X.clean.json captions/X.chunked.json [captions/X.overrides.json]` sets `pageBreakAfter` on meaningful phrases; fix single bad splits via overrides (`forceBreakAfter` / `noBreakAfter`, keyed by word `startMs`). Use `components/ReelCaptions.tsx` (pages split only by `pageBreakAfter`; `emphasize={["на спор?"]}` = big yellow marker; `highlightWords={["Франкенштейн", ...]}` = key words in yellow inside a normal line, prefix match, 1–2 per phrase; `karaoke` = highlight the spoken word — an alternative style, don't mix with highlightWords). Inline the caption array in the JSX (Studio caption editor writes back to it).
7. **Composition** (1080×1920, 30 fps): one `<Sequence trimBefore={...} durationInFrames={...}>` holding `<Video src=X_vertical.mp4>` + `<ReelCaptions style={{top:1060, zIndex:10}}>`. Graphics go **outside** that sequence as their own `<Sequence from={reelFrame}>` nodes (reel time = source time − trim start). Write a reel-time transcript (`captions/X.reel-timeline.txt`) to anchor graphics to phrases.
8. **Graphics** — see style.md; each visual comes from the current line, never from the list below. Components from the Frankenstein reel in `components/graphics/` (copy into `src/graphics/`): `Sticker`, `MonocleGuy` (moods: bored/shocked/disgusted/approve/wink), `Cataclysm`, `Frost`, `BetZoom`, `FreezeFrame`, `VillaRain`, `MaryWinner`, `Scoreboard`, `Doodles` (Ghost, Trophy), `VampyreBook`, `VampireShadow`, `DraculaSlot`, `ByronCool`, `YearWithoutSummer`; fonts in `fonts.ts`. Public-domain art: Wikimedia Commons `thumb.php?f=<file>&w=800` (2000+ for full-screen); confirm the licence; ask before downloading.
8b. **Background replacement** (optional): see background.md — matte the talking head in Studio (Remove background), normalise to CFR, then put a new background (or text/graphics behind the person) between the background and the alpha person layer with `components/BgVariants.tsx`.
9. **SFX**: only on jokes/transitions (record scratch on freeze frame, vine boom on a crash zoom, soft whoosh into a full-screen cutaway); never literal (volcano, rain, nut). Volume ≈0.2–0.45 under the voice.
   - Pick sounds **only from `REELS_HOME/sfx-library/our-library.json`** (`favourites: { id: "when to use" }`) — you cannot hear, so the user's comment decides which of several similar sounds fits. Files: `sfx-library/kit/<id>.wav` (opus-sound-layer hits), `sfx-library/extra/<id>.mp3` (whole Freesound recordings, see `extra/manifest.json`), `ours/*` = the project's `public/sfx`. Copy the chosen file into the project's `public/sfx/`.
   - The user curates by ear via the «Библиотека звуков» launcher in REELS_HOME (`.bat` / `.command`; runs `tools/sfx-board-server.mjs` on 127.0.0.1:8765 and opens the page). It writes `our-library.json` (`favourites`, `toDelete`, `deleted`, `savedAt`) on every change and moves confirmed deletions to `sfx-library/_deleted/<type>/` itself. If the page was opened as a plain file, it may have saved via "Save as" or into Downloads — check `~/Downloads/our-library*.json` / Documents for a newer copy.
   - Before using sounds: if `toDelete` is not empty (page opened without the helper), move those files (and `.json` sidecars) to `_deleted/<type>/`, remove them from `kit/catalog.json` or `extra/manifest.json`, clear `toDelete`, rebuild the page (`node tools/build-sfx-board.mjs`). Never hard-delete; never edit the user's comments.
   - If several favourites lack comments (e.g. four similar ticks), ask the user what each is for instead of guessing. If the library is empty or nothing fits, say so and ask the user to pick on the page.
   - More whole recordings: `node tools/fetch-openverse-sfx.mjs [category]` (edit its CATEGORIES; Openverse allows 200 requests/day).
10. **Render** `npx remotion render <Comp> out/<name>-vN.mp4`, then **normalise loudness** `node scripts/loudness.mjs out/<name>-vN.mp4 out/<name>-vN-final.mp4` (−14 LUFS, ≤ −1.5 dBTP; video copied as is) and hand over the `-final` file; then **review it yourself** with the `watch` skill (claude-video, local engine, no speech backend): read the frames, look for overlaps (e.g. confetti over a speech bubble), cut-off text, stray elements — before sending it to the user.

## Pitfalls seen

- Remotion's bundled ffmpeg (`npx remotion ffmpeg`) lacks most filters (blur, hflip, xstack) → use the system FFmpeg.
- `@remotion/effects` (shadowsHighlights) and CSS `filter` on `@remotion/media` `<Video>` did not apply in renders here → grade with overlay layers (`mixBlendMode: color / soft-light`), mirror with `scale: "-1 1"`.
- "Error opening output file … merged.wav" = temp dir vanished mid-render → just re-run.
- Fine engravings shimmer when downscaled → pre-scale with ffmpeg lanczos to ~2× display size + `blur(0.45px)`.
- White captions over light full-screen art are unreadable → put a dark strip behind the caption band.
- Disk space: footage + proxies + 3 GB Whisper cache add up; every render needs free space ≈ size of `public/` (temp copy). Check free space before rendering; delete old `out/` versions and temporary proxies when done.
- Film clips (e.g. Dracula 1992) are copyrighted: never download them yourself; the user supplies the clip, mute it, and warn about Instagram Content ID.
