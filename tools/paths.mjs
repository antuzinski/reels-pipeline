// Shared paths for the reels tools. The root ("REELS_HOME") is the folder that contains tools/,
// e.g. C:\Reels on Windows or ~/Reels on macOS; override with the REELS_HOME environment variable.
// REELS_PROJECT names the Remotion project folder inside the root (default: first-reel).
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export const ROOT = resolve(process.env.REELS_HOME ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
export const LIB = join(ROOT, "sfx-library");
export const KIT = join(LIB, "kit");
export const EXTRA = join(LIB, "extra");
export const SAVED = join(LIB, "our-library.json");
export const PROJECT = join(ROOT, process.env.REELS_PROJECT ?? "first-reel");
export const PROJECT_SFX = join(PROJECT, "public", "sfx");

// Open a URL in the default browser (Windows / macOS / Linux)
export function openUrl(url) {
  const [cmd, args] =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]]
    : ["xdg-open", [url]];
  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
}
