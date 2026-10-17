import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { handFont, ink, stampFont } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CONFETTI = ["#ffd60a", "#ff4d6d", "#4cc9f0", "#80ed99", "#ffffff"];

// Full-screen: Mary Shelley wins the bet — sarcastic speech bubble, confetti, "ПОБЕДИТЕЛЬНИЦА"
export const MaryWinner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, 4, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], clamp);
  const bubble = spring({ frame: frame - 12, fps, config: { damping: 11, mass: 0.6 } });
  const title = spring({ frame: frame - 16, fps, config: { damping: 9, mass: 0.6 } });

  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: "black", overflow: "hidden" }}>
      {/* Mary Shelley by Richard Rothwell; face centred at ~(818, 560) after scaling */}
      <Img
        src={staticFile("graphics/mary-shelley-large.jpg")}
        style={{
          position: "absolute",
          height: 1920,
          width: 1576,
          left: -278,
          top: 0,
          transformOrigin: "818px 560px",
          scale: String(
            interpolate(frame, [0, durationInFrames], [1.05, 1.18], {
              ...clamp,
              easing: Easing.out(Easing.quad),
            }),
          ),
        }}
      />
      {/* Golden light */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(255,214,10,0.35), rgba(255,214,10,0) 45%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Confetti */}
      {new Array(110).fill(true).map((_, i) => {
        const delay = random(`cf-d-${i}`) * 0.6;
        const local = Math.max(0, t - 0.4 - delay);
        if (local <= 0) return null;
        const x = random(`cf-x-${i}`) * 1080 + Math.sin(local * 3 + i) * 40;
        const y = -40 + local * (420 + random(`cf-s-${i}`) * 380);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 14,
              height: 24,
              backgroundColor: CONFETTI[i % CONFETTI.length],
              rotate: `${local * 400 * (random(`cf-r-${i}`) - 0.5)}deg`,
              borderRadius: 3,
            }}
          />
        );
      })}
      {/* Sarcastic speech bubble */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 170,
          width: 600,
          scale: String(bubble),
          transformOrigin: "80% 100%",
        }}
      >
        <div
          style={{
            padding: "22px 30px",
            backgroundColor: "white",
            border: `6px solid ${ink}`,
            borderRadius: 46,
            fontFamily: handFont,
            fontWeight: 700,
            fontSize: 60,
            lineHeight: 1.1,
            color: ink,
            textAlign: "center",
            boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
          }}
        >
          Мальчики, ну вы там как, дописали?
        </div>
        <svg width={120} height={110} viewBox="0 0 120 110" style={{ position: "absolute", left: 420, top: "100%", marginTop: -8 }}>
          <path d="M10 0 L70 0 L105 100 Z" fill="white" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
          <rect x={14} y={-4} width={52} height={12} fill="white" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1330,
          textAlign: "center",
          scale: String(title),
          rotate: "-3deg",
        }}
      >
        <span
          style={{
            fontFamily: stampFont,
            fontWeight: 800,
            fontSize: 84,
            color: "#ffd60a",
            WebkitTextStroke: `9px ${ink}`,
            paintOrder: "stroke fill",
            textShadow: "0 12px 30px rgba(0,0,0,0.6)",
          }}
        >
          ПОБЕДИТЕЛЬНИЦА
        </span>
      </div>
    </AbsoluteFill>
  );
};
