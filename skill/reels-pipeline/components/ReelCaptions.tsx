import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import React, { useMemo } from "react";
import {
  Interactive,
  spring,
  useCurrentFrame,
  useVideoConfig,
  type InteractiveTransformProps,
  type InteractivitySchema,
  type SequenceProps,
} from "remotion";

const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["cyrillic", "latin"],
});

// Reel-style captions: white bold text with a soft dark shadow, no background.
// Pages are split only where a caption has pageBreakAfter: true.
type ReelCaptionsProps = InteractiveTransformProps &
  Pick<SequenceProps, "width"> & {
    readonly captions: Caption[];
    readonly fontSize?: number;
    // Page texts (trimmed) shown bigger with a yellow marker highlight
    readonly emphasize?: string[];
    // Key words shown in yellow inside a normal page (case-insensitive, punctuation ignored, prefix match: "франкенштейн" also hits "Франкенштейна")
    readonly highlightWords?: string[];
    // Karaoke: the word being spoken right now turns yellow
    readonly karaoke?: boolean;
  };

const HIGHLIGHT = "#ffd60a";
const bare = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");

const reelCaptionsSchema = {
  ...Interactive.captionsSchema,
  width: {
    type: "number",
    min: 1,
    step: 1,
    default: undefined,
    description: "Caption area width",
    hiddenFromList: false,
  },
  fontSize: {
    type: "number",
    min: 20,
    max: 160,
    step: 1,
    default: 76,
    description: "Font size",
    hiddenFromList: false,
  },
  karaoke: {
    type: "boolean",
    default: false,
    description: "Highlight the word being spoken",
  },
} as const satisfies InteractivitySchema;

const ReelCaptionsContent: React.FC<ReelCaptionsProps> = ({
  captions,
  style,
  width = 900,
  fontSize = 76,
  emphasize = [],
  highlightWords = [],
  karaoke = false,
}) => {
  const keys = useMemo(() => highlightWords.map(bare).filter(Boolean), [highlightWords]);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pages = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: Number.MAX_SAFE_INTEGER,
      }).pages,
    [captions],
  );
  const currentTimeMs = (frame / fps) * 1000;
  const page = pages.find(
    (candidate) =>
      currentTimeMs >= candidate.startMs &&
      currentTimeMs < candidate.startMs + candidate.durationMs,
  );

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        width,
        ...style,
      }}
    >
      {page && emphasize.includes(page.text.trim()) ? (
        <div
          style={{
            fontFamily,
            fontSize: fontSize * 1.55,
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: "center",
            rotate: "-2deg",
            scale: String(
              spring({
                frame: frame - Math.round((page.startMs / 1000) * fps),
                fps,
                config: { damping: 9, mass: 0.6 },
              }),
            ),
          }}
        >
          <span
            style={{
              color: "#111111",
              backgroundColor: "#ffd60a",
              padding: "2px 22px",
              borderRadius: 10,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              boxShadow: "0 8px 22px rgba(0, 0, 0, 0.35)",
            }}
          >
            {page.text.trim()}
          </span>
        </div>
      ) : page ? (
        <div
          style={{
            color: "#ffffff",
            fontFamily,
            fontSize,
            fontWeight: 700,
            lineHeight: 1.12,
            textAlign: "center",
            textWrap: "balance",
            whiteSpace: "pre-wrap",
            WebkitTextStroke: "2px rgba(0, 0, 0, 0.35)",
            paintOrder: "stroke fill",
            textShadow:
              "0 2px 6px rgba(0, 0, 0, 0.55), 0 0 18px rgba(0, 0, 0, 0.35)",
          }}
        >
          {keys.length || karaoke
            ? page.tokens.map((token, i) => {
                const word = bare(token.text);
                const isKey = word.length > 0 && keys.some((k) => word.startsWith(k));
                const isNow = karaoke && currentTimeMs >= token.fromMs && currentTimeMs < token.toMs;
                const text = i === 0 ? token.text.trimStart() : token.text;
                return isKey || isNow ? (
                  <span key={i} style={{ color: HIGHLIGHT }}>
                    {text}
                  </span>
                ) : (
                  <span key={i}>{text}</span>
                );
              })
            : page.text.trim()}
        </div>
      ) : null}
    </div>
  );
};

export const ReelCaptions = Interactive.withSchema({
  Component: ReelCaptionsContent,
  componentName: "<ReelCaptions>",
  schema: reelCaptionsSchema,
  wrapInSequence: true,
});
