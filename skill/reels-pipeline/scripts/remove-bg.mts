// Separates a talking-head video into layers with @remotion/video-matting (local, WebGPU):
//   <out>-base.webm  — the original, opaque (audio goes here)
//   <out>-fg.webm    — the person only, VP9 with alpha
// Put any background (or text/graphics "behind" the person) between the two layers in Remotion.
//
// Usage: node scripts/remove-bg.mts <video> <out-prefix> [modnet|ben2-base]
// e.g.   node scripts/remove-bg.mts ../footage/selfie-test.mp4 public/selfie-test
import { registerMediabunnyServer } from "@mediabunny/server";
import {
  canUseVideoMatting,
  downloadVideoMattingModel,
  isVideoMattingModelCached,
  separateVideoLayers,
  type VideoMattingModel,
} from "@remotion/video-matting";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [src, outPrefix, modelArg] = process.argv.slice(2);
if (!src || !outPrefix) throw new Error("usage: remove-bg.mts <video> <out-prefix> [modnet|ben2-base]");
const model = (modelArg ?? "modnet") as VideoMattingModel;

registerMediabunnyServer();

const support = await canUseVideoMatting({ model });
if (!support.supported) throw new Error(`${model}: ${support.detailedReason ?? support.reason}`);

if (!(await isVideoMattingModelCached({ model }))) {
  console.log(`downloading model ${model}…`);
  await downloadVideoMattingModel({ model });
}

const started = Date.now();
let last = -1;
await using result = await separateVideoLayers({
  src: resolve(src),
  model,
  audio: "base",
  videoBitrate: "very-high",
  onModelLoadProgress: (p) => {
    const pct = Math.round(((p as { progress?: number }).progress ?? 0) * 100);
    if (pct % 25 === 0 && pct !== last) { last = pct; console.log(`model ${pct}%`); }
  },
  onProgress: (p) => {
    if (p.stage === "processing") {
      const pct = Math.floor(p.progress * 10) * 10;
      if (pct !== last) { last = pct; console.log(`frames ${p.processedFrames} (${pct}%)`); }
    } else console.log("finalizing…");
  },
});

await mkdir(dirname(resolve(outPrefix)), { recursive: true });
for (const [layer, suffix] of [[result.base, "base"], [result.foreground, "fg"]] as const) {
  const blob = await layer.getBlob();
  await writeFile(`${outPrefix}-${suffix}.webm`, Buffer.from(await blob.arrayBuffer()));
}
const secs = (Date.now() - started) / 1000;
console.log(`${model}: ${result.processedFrames} frames, ${result.width}×${result.height}, ${secs.toFixed(1)} s → ${outPrefix}-base.webm, ${outPrefix}-fg.webm`);
