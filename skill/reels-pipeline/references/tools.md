# Tools

Tested on a Windows 11 laptop (16 GB RAM, integrated Intel GPU, little free disk). macOS commands are in the third column; full step-by-step setup is in the repo's INSTALL.md.

| Tool | Install (Windows) | macOS | Used for |
|---|---|---|---|
| Node.js 22+ | `winget install --id OpenJS.NodeJS --exact` | `brew install node` | Remotion, tools/*.mjs |
| Git, Python 3.10+, uv | `winget install --id Git.Git`, `--id Python.Python.3.13`, `--id astral-sh.uv` | `brew install git python uv` | cloning, claude-video, opus-sound-layer |
| Remotion skills | `npx -y skills@latest add remotion-dev/skills -g -y` | same | Remotion know-how |
| FFmpeg (full build) | `winget install --id Gyan.FFmpeg --exact` | `brew install ffmpeg` | proxies, cuts, probing, loudness |
| yt-dlp | `winget install --id yt-dlp.yt-dlp --exact` | `brew install yt-dlp` | needed by claude-video; clip downloads (mind copyright) |
| auto-editor | `uv tool install auto-editor` | same | auto-cut pauses: `auto-editor in.mp4 --no-open --margin 0.2sec -o out.mp4` (20 s 1080p ≈ 30 s on the test laptop) |
| claude-video (`watch`) | `claude plugin marketplace add bradautomates/claude-video` + `claude plugin install watch@claude-video`, then setup `--engine local`, `--backend none` | same; local WhisperX verified on Apple Silicon | self-review renders: ~60 frames of a 1.5-min reel in ~13 s, ~0.2 GB RAM |
| opus-sound-layer | `git clone https://github.com/Bodila51/opus-sound-layer tools/opus-sound-layer`; `uv run scripts/sfx.py kit --out ../../sfx-library/kit` | same | CC0 SFX kit (Kenney + Freesound hits, 1139 sounds, ~220 MB), mixer to −14 LUFS, QA |
| Extra SFX (whole recordings) | `node tools/fetch-openverse-sfx.mjs [category]` → `sfx-library/extra/<cat>/` + `manifest.json` (Freesound CC0 via Openverse, no key; 20 req/min, 200/day; edit CATEGORIES) | same | backgrounds the kit lacks: keyboard typing, typewriter + bell/carriage, pen, pages, shutter, projector, laugh, applause (~320 files, ~100 MB) |
| SFX page + helper | `Библиотека звуков.bat` (tools/sfx-board-server.mjs on 127.0.0.1:8765); page built by tools/build-sfx-board.mjs | `Библиотека звуков.command` | listen, ★ + "when to use", 🗑 with confirmation; saves `our-library.json` directly |
| Whisper large-v3-turbo | via `@remotion/whisper-webgpu` (scripts/transcribe.mts) | same; `mlx-whisper` is faster on Apple Silicon | transcription with word timings |

claude-video's local WhisperX needs 8 GB RAM + 3 GB disk — skipped on the test laptop; transcription uses our own Whisper.

## On the shelf (not installed)

| Tool | When | Platform note |
|---|---|---|
| HyperFrames (heygen-com/hyperframes) | HTML-based alternative to Remotion, Apache-2.0; only if Remotion's licence becomes a problem | Node 22+, any OS |
| GSAP | animations inside HyperFrames | any |
| OpenScreen | screencasts with auto-zoom (app demos) | Win/macOS/Linux, still rough |
| librosa | cut on music beats | Python, any |
| pyannote-audio | several speakers (podcasts) | heavy; HF token |
| mlx-whisper, parakeet-mlx, mlx-audio | fast local ASR / speakers | **Apple Silicon only** |
| ManimGX | math/3D explainers | Python 3.13+ |
| Anatomy (wheresryan22/anatomy) | isometric "how it works" machines for tech topics | Claude skill, Node 20+ |
| three.js / @remotion/three | 3D | any |
| Puppeteer | frame capture — Remotion already does it | any |

Other open SFX sources (manual download): Pixabay Sound Effects (free incl. commercial, no attribution), Mixkit (free licence), ZapSplat (free tier needs attribution), Sonniss GDC bundles (royalty-free, 20–30 GB each). BBC Sound Effects is personal/educational only — not for monetised reels.
