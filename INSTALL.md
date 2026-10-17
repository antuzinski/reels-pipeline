# INSTALL — for Claude Code (and humans)

> **Claude:** follow these steps in order on the user's machine. Detect the OS first (`win32` → PowerShell/winget; `darwin` → Homebrew). Skip what is already installed (check versions). Ask the user before multi-GB downloads and before anything that changes system settings. Explain progress in the user's language (the author speaks Russian). At the end run the checks in step 8 and report results honestly.

**REELS_HOME** — the workspace folder. Default: `C:\Reels` (Windows) or `~/Reels` (macOS). Everything below lives there.

## 1. Base tools

| | Windows (PowerShell) | macOS |
|---|---|---|
| Package manager | winget (built in) | Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` (ask first) |
| Node.js 22+ | `winget install --id OpenJS.NodeJS --exact` | `brew install node` |
| Git | `winget install --id Git.Git --exact` | `brew install git` (or Xcode CLT) |
| Python 3.10+ | `winget install --id Python.Python.3.13 --exact` — the `python` Store alias is **not** an interpreter; verify with `py -3 --version` | `brew install python` |
| uv | `winget install --id astral-sh.uv --exact` | `brew install uv` |
| FFmpeg (full) | `winget install --id Gyan.FFmpeg --exact` | `brew install ffmpeg` |
| yt-dlp | `winget install --id yt-dlp.yt-dlp --exact` | `brew install yt-dlp` |
| auto-editor | `uv tool install auto-editor` | `uv tool install auto-editor` |

On Windows, reopen the terminal (or reload PATH) after winget installs.

## 2. Get the repo into REELS_HOME

- New machine: `git clone https://github.com/antuzinski/reels-pipeline <REELS_HOME>`.
- REELS_HOME already exists and is not empty: clone to a temp folder and copy `tools/`, `install/`, `sfx-library/`, `examples/` and the launchers into REELS_HOME **without overwriting** existing files (especially `sfx-library/our-library.json` — ask before replacing it).
- macOS: `chmod +x "<REELS_HOME>"/*.command`.

## 3. Claude Code skills and plugin

```bash
npx -y skills@latest add remotion-dev/skills -g -y
```
Copy the reels skill to the personal skills folder:
- Windows: `Copy-Item -Recurse <REELS_HOME>\skill\reels-pipeline $env:USERPROFILE\.claude\skills\`
- macOS: `cp -R <REELS_HOME>/skill/reels-pipeline ~/.claude/skills/`

claude-video (lets Claude "watch" renders):
```bash
claude plugin marketplace add bradautomates/claude-video
claude plugin install watch@claude-video
```
Then configure its light local mode (no speech model, ~0.2 GB RAM). Find `setup.py` under `~/.claude/plugins/cache/claude-video/watch/<version>/skills/watch/scripts/` and run with the real Python (`py -3` on Windows, `python3` on macOS):
```bash
python3 setup.py --engine local
python3 setup.py --backend none --detail balanced
python3 setup.py --check   # exit 0 = ready
```
(Optional, macOS Apple Silicon with ≥16 GB RAM: `--backend whisperx` for local speech; ~1.5 GB download — ask first.)

## 4. Remotion project

Inside REELS_HOME (skip if `first-reel/` exists):
```bash
npx create-video@latest --yes --blank --no-tailwind first-reel
cd first-reel
npm i
npx remotion add @remotion/media @remotion/captions @remotion/transitions @remotion/google-fonts @remotion/effects
npx remotion add @remotion/whisper-webgpu @huggingface/transformers mediabunny @mediabunny/server
mkdir -p src/graphics scripts captions public/sfx public/graphics
```
Copy from `skill/reels-pipeline/`: `components/ReelCaptions.tsx` → `src/`, `components/graphics/*` → `src/graphics/`, `scripts/*` → `scripts/`. Add to `remotion.config.ts`: `Config.setChromiumOpenGlRenderer("angle");`.
Run `npx tsc --noEmit` — it should pass (components that reference example images compile even if the images are absent).

## 5. Sound library

```bash
node install/setup-sfx-library.mjs
```
Downloads the CC0 kit (~220 MB, opus-sound-layer) and whole recordings from Freesound (~100 MB, throttled: 20 requests/min, 200/day — if the daily limit is hit, re-run tomorrow, it resumes), copies the curated favourites, builds `sfx-library/index.html`. Takes ~15–25 min. Ask the user before starting (≈320 MB).

## 6. Launchers

Already in REELS_HOME: `Библиотека звуков.bat` / `.command` (sound library page with auto-save, 127.0.0.1:8765) and `Открыть студию.bat` / `.command` (Remotion Studio for `first-reel`, or pass a project name).

## 7. Memory (optional)

Tell Claude to remember: the workspace path (REELS_HOME), that reels follow the `reels-pipeline` skill and its `references/style.md`, and the machine's limits (RAM/disk).

## 8. Checks (report each)

1. `node -v` ≥ 22, `ffmpeg -version` shows a full build (`ffmpeg -filters | grep -c gblur` > 0), `yt-dlp --version`, `auto-editor --version`.
2. `npx remotion versions` inside `first-reel` — all packages on the same version.
3. `npx tsc --noEmit` in `first-reel` passes.
4. claude-video: `setup.py --check` exits 0.
5. Sound library: `sfx-library/index.html` exists; start the helper (`node tools/sfx-board-server.mjs --no-open`), `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8765/sfx-library/index.html` → 200, then stop it.
6. Render smoke test: in `first-reel`, `npx remotion still <any composition> out/check.png` (create a 1-frame composition if none exists), then delete `out/check.png`.

## Platform notes

- **macOS:** Whisper via `@remotion/whisper-webgpu` works; on Apple Silicon `mlx-whisper` is faster. Mac-only extras: `mlx-whisper`, `parakeet-mlx`, `mlx-audio`.
- **Windows:** Remotion's bundled `npx remotion ffmpeg` is a minimal build — always use the system FFmpeg for filters.
- Low RAM (≤16 GB): don't install claude-video's WhisperX; render long 4K footage only via a 1080×1920 proxy (see the skill, step 5).
