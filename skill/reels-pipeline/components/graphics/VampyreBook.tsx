import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { handFont, ink, paper, serifFont } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const gold = "#d9b45a";

type Props = {
  readonly x: number;
  readonly y: number;
  readonly label: string;
};

// Code-drawn antique book cover for Polidori's "The Vampyre" (1819) —
// the real title page is a plain white page that is unreadable at sticker size.
export const VampyreBook: React.FC<Props> = ({ x, y, label }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 11, mass: 0.7 } });
  const shine = interpolate(frame, [8, 30], [-120, 420], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        scale: String(0.55 + 0.45 * enter),
        rotate: `${-5 + (1 - enter) * -14}deg`,
        translate: `0px ${Math.sin((frame / fps) * 2.2) * 6}px`,
        opacity: interpolate(frame, [0, 4, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], clamp),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 300,
          height: 400,
          borderRadius: "6px 14px 14px 6px",
          background: "linear-gradient(135deg, #5a1418 0%, #3a0c10 60%, #24070a 100%)",
          boxShadow: "inset 14px 0 18px rgba(0,0,0,0.5), 0 14px 28px rgba(0,0,0,0.5)",
          overflow: "hidden",
          fontFamily: serifFont,
          color: gold,
          textAlign: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 18, border: `3px solid ${gold}`, borderRadius: 6 }} />
        <div style={{ position: "absolute", inset: 28, border: `1px solid ${gold}`, borderRadius: 4 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, fontSize: 26, letterSpacing: 6 }}>THE</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 104, fontSize: 52, fontWeight: 900, letterSpacing: 2 }}>
          VAMPYRE
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 176, fontSize: 30, fontStyle: "italic" }}>a Tale</div>
        {/* Bat ornament */}
        <svg width={120} height={60} viewBox="0 0 120 60" style={{ position: "absolute", left: 90, top: 236 }}>
          <path
            d="M60 18 C52 6 44 10 40 20 C30 8 14 10 4 24 C16 22 22 30 24 40 C32 32 40 34 46 44 C50 36 56 34 60 40 C64 34 70 36 74 44 C80 34 88 32 96 40 C98 30 104 22 116 24 C106 10 90 8 80 20 C76 10 68 6 60 18 Z"
            fill={gold}
          />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 320, fontSize: 30, fontWeight: 900, letterSpacing: 4 }}>1819</div>
        {/* Moving gold glint */}
        <div
          style={{
            position: "absolute",
            top: -40,
            left: shine,
            width: 60,
            height: 500,
            rotate: "20deg",
            background: "linear-gradient(90deg, rgba(255,240,200,0), rgba(255,240,200,0.35), rgba(255,240,200,0))",
          }}
        />
      </div>
      <div
        style={{
          marginTop: -14,
          padding: "4px 18px",
          backgroundColor: paper,
          color: ink,
          fontFamily: handFont,
          fontWeight: 700,
          fontSize: 40,
          borderRadius: 4,
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          rotate: "3deg",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};
