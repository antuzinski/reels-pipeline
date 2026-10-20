import type { Caption } from "@remotion/captions";
import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { ReelCaptions } from "./ReelCaptions";

// A source-time segment to keep (from scripts/make-cuts.mjs)
export type Segment = { readonly fromMs: number; readonly toMs: number };

type Props = {
  readonly src: string;
  readonly segments: readonly Segment[];
  readonly captions: Caption[];
  // Punch-in: every other segment is shown this much closer (1.1 = 110 %), so cuts read as camera changes
  readonly punchIn?: number;
  // Slow push-in inside each segment (0.03 = grows by 3 % over the segment)
  readonly pushIn?: number;
  // Point the zoom aims at, in % of the frame (face area)
  readonly focusX?: number;
  readonly focusY?: number;
  readonly highlightWords?: string[];
  readonly karaoke?: boolean;
  readonly emphasize?: string[];
};

export const segmentFrames = (s: Segment, fps: number) => Math.max(1, Math.round(((s.toMs - s.fromMs) / 1000) * fps));
// Composition length for a cut list
export const segmentsDurationInFrames = (segments: readonly Segment[], fps: number) =>
  segments.reduce((sum, s) => sum + segmentFrames(s, fps), 0);

// One kept piece: the video zoomed (punch-in + slow push-in), captions unzoomed on top.
// Children of the inner <Sequence trimBefore> see source time, so the full caption array works per segment.
const Piece: React.FC<{ readonly seg: Segment; readonly index: number } & Required<Pick<Props, "src" | "captions" | "punchIn" | "pushIn" | "focusX" | "focusY">> &
  Pick<Props, "highlightWords" | "karaoke" | "emphasize">> = ({ seg, index, src, captions, punchIn, pushIn, focusX, focusY, highlightWords, karaoke, emphasize }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const trim = Math.round((seg.fromMs / 1000) * fps);
  const base = index % 2 === 1 ? punchIn : 1;
  const grow = interpolate(frame, [0, durationInFrames], [0, pushIn], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(base + grow), transformOrigin: `${focusX}% ${focusY}%` }}>
        <Sequence trimBefore={trim} premountFor={fps}>
          <Video src={src} premountFor={fps} objectFit="cover" style={{ width: "100%", height: "100%" }} />
        </Sequence>
      </AbsoluteFill>
      <Sequence trimBefore={trim} premountFor={fps}>
        <ReelCaptions
          captions={captions}
          width={920}
          fontSize={76}
          highlightWords={highlightWords}
          karaoke={karaoke}
          emphasize={emphasize}
          style={{ position: "absolute", top: 1060, translate: "80px 0px", zIndex: 10 }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Talking head edited from a cut list: jump cuts hidden by alternating punch-in, slow push-in, captions.
// Use a proxy with zoom headroom (e.g. 1350×2400 for punchIn 1.1 + pushIn 0.03) so zooms stay sharp.
export const TalkingHead: React.FC<Props> = ({
  src,
  segments,
  captions,
  punchIn = 1.1,
  pushIn = 0.03,
  focusX = 50,
  focusY = 32,
  highlightWords,
  karaoke,
  emphasize,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      {segments.map((seg, i) => (
        <Series.Sequence key={`${seg.fromMs}-${seg.toMs}`} name={`Take ${i + 1}`} durationInFrames={segmentFrames(seg, fps)} premountFor={fps}>
          <Piece
            seg={seg}
            index={i}
            src={src}
            captions={captions}
            punchIn={punchIn}
            pushIn={pushIn}
            focusX={focusX}
            focusY={focusY}
            highlightWords={highlightWords}
            karaoke={karaoke}
            emphasize={emphasize}
          />
        </Series.Sequence>
      ))}
    </Series>
  );
};
