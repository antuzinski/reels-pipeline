import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  // Local frame where the frost has fully grown ("ниже нуля")
  readonly peakAt: number;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FLAKES = 40;

// The whole frame freezes: cold blue grade, frost creeping in from the edges, snowfall
export const Frost: React.FC<Props> = ({ peakAt }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const grow = interpolate(frame, [0, peakAt], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const fade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], clamp);
  // Frost-free hole in the middle shrinks as the frost grows
  const hole = interpolate(grow, [0, 1], [100, 91]);
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {/* Cold colour grade */}
      <AbsoluteFill
        style={{
          backgroundColor: "rgb(70, 140, 255)",
          mixBlendMode: "color",
          opacity: 0.14 * grow,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: "rgb(200, 225, 255)",
          mixBlendMode: "soft-light",
          opacity: 0.18 * grow,
        }}
      />
      {/* Frost texture from the edges */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="frost-noise" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves={4} seed={7} />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.86  0 0 0 0 0.94  0 0 0 0 1  0 0 0 2.6 -1.1"
            />
          </filter>
          <radialGradient id="frost-mask-gradient" cx="50%" cy="45%" r="72%">
            <stop offset={`${hole - 12}%`} stopColor="black" />
            <stop offset={`${hole}%`} stopColor="white" />
          </radialGradient>
          <mask id="frost-mask">
            <rect width={1080} height={1920} fill="url(#frost-mask-gradient)" />
          </mask>
        </defs>
        <rect
          width={1080}
          height={1920}
          filter="url(#frost-noise)"
          mask="url(#frost-mask)"
          opacity={0.5 * grow}
        />
      </svg>
      {/* Snow */}
      {new Array(FLAKES).fill(true).map((_, i) => {
        const size = 4 + random(`snow-size-${i}`) * 10;
        const speed = 70 + random(`snow-speed-${i}`) * 110;
        const y = ((random(`snow-y-${i}`) * 2000 + t * speed) % 2000) - 60;
        const x = random(`snow-x-${i}`) * 1080 + Math.sin(t * 1.3 + i) * 22;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: "white",
              opacity: (0.55 + random(`snow-o-${i}`) * 0.4) * Math.min(1, grow * 2),
              filter: size > 10 ? "blur(1.5px)" : "blur(0.5px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
