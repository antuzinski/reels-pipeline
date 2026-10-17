import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { handFont, paper } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Full-screen "old vampire": Orlok's shadow creeping up a lit wall, silent-film flicker
export const VampireShadow: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 4, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], clamp);
  const flicker = 0.88 + random(`flick-${Math.floor(frame / 2)}`) * 0.12;
  const creep = interpolate(frame, [0, durationInFrames], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: "#0d0b09", overflow: "hidden" }}>
      {/* Lit plaster wall */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 45% 40%, #cfc3a8 0%, #a89a7d 35%, #4a4236 75%, #15120e 100%)",
          filter: `brightness(${flicker})`,
        }}
      />
      {/* Shadow of Count Orlok (CC0 silhouette), sliding in and growing */}
      <Img
        src={staticFile("graphics/orlok-shadow.svg")}
        style={{
          position: "absolute",
          width: 940,
          height: 1000,
          left: interpolate(creep, [0, 1], [420, 70]),
          top: interpolate(creep, [0, 1], [380, 230]),
          scale: String(interpolate(creep, [0, 1], [0.9, 1.05])),
          objectFit: "contain",
          opacity: 0.88,
          filter: "blur(3px)",
        }}
      />
      {/* Silent film vignette + grain-ish noise lines */}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)" }}
      />
      {random(`line-${Math.floor(frame / 3)}`) > 0.6 ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: random(`line-x-${Math.floor(frame / 3)}`) * 1080,
            width: 2,
            backgroundColor: "rgba(255,255,255,0.18)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1360,
          textAlign: "center",
          fontFamily: handFont,
          fontWeight: 700,
          fontSize: 64,
          color: paper,
          textShadow: "0 4px 14px rgba(0,0,0,0.8)",
        }}
      >
        вампир до 1819-го
      </div>
    </AbsoluteFill>
  );
};
