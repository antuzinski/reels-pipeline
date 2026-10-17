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
import { stampFont } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Full-screen dramatic crash zoom onto Byron's face with shake and a "Ставки!" punchline
export const BetZoom: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const shakeAmp = interpolate(frame, [0, 3, 14, durationInFrames], [34, 18, 6, 4], clamp);
  const shakeX = (random(`bx-${frame}`) - 0.5) * shakeAmp;
  const shakeY = (random(`by-${frame}`) - 0.5) * shakeAmp;
  const text = spring({ frame: frame - 4, fps, config: { damping: 8, mass: 0.5 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        overflow: "hidden",
        opacity: interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp),
      }}
    >
      <AbsoluteFill style={{ translate: `${shakeX}px ${shakeY}px` }}>
        {/* Lord Byron after Thomas Phillips (engraving); face centred at ~(748, 551) */}
        <Img
          src={staticFile("graphics/byron-large.jpg")}
          style={{
            position: "absolute",
            height: 1920,
            width: 1574,
            left: -208,
            top: 0,
            transformOrigin: "748px 560px",
            filter: "contrast(1.25) brightness(0.95)",
            scale: String(
              interpolate(frame, [0, 4, durationInFrames], [1.1, 2.1, 2.3], {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              }),
            ),
          }}
        />
      </AbsoluteFill>
      {/* Dramatic red vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0) 35%, rgba(90,0,0,0.75) 100%)",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: interpolate(frame, [0, 1, 5], [0.9, 0.6, 0], clamp) }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1330,
          textAlign: "center",
          scale: String(text),
          rotate: "-4deg",
        }}
      >
        <span
          style={{
            fontFamily: stampFont,
            fontWeight: 800,
            fontSize: 170,
            color: "#ffd60a",
            WebkitTextStroke: "10px #111",
            paintOrder: "stroke fill",
            textShadow: "0 12px 30px rgba(0,0,0,0.6)",
          }}
        >
          Ставки!
        </span>
      </div>
    </AbsoluteFill>
  );
};
