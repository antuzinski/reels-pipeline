import {
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ink, paper, serifFont, stampRed } from "./fonts";

type Props = {
  // Local frame at which the sun gets crossed out ("год без лета")
  readonly crossAt: number;
};

// "1816" dropping in digit by digit, plus a sun that gets crossed out and fades to grey
export const YearWithoutSummer: React.FC<Props> = ({ crossAt }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cross = interpolate(frame, [crossAt, crossAt + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const sunColor = interpolateColors(
    frame,
    [crossAt + 6, crossAt + 20],
    ["#ffc93c", "#9a9a9a"],
  );
  const sunIn = spring({ frame: frame - 8, fps, config: { damping: 12 } });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1330,
          display: "flex",
          fontFamily: serifFont,
          fontWeight: 900,
          fontSize: 230,
          lineHeight: 1,
          color: paper,
          WebkitTextStroke: `6px ${ink}`,
          paintOrder: "stroke fill",
          textShadow: "0 10px 24px rgba(0, 0, 0, 0.35)",
        }}
      >
        {"1816".split("").map((digit, i) => {
          const d = spring({ frame: frame - i * 3, fps, config: { damping: 10 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                translate: `0px ${(1 - d) * -160}px`,
                opacity: Math.min(1, d * 2),
              }}
            >
              {digit}
            </span>
          );
        })}
      </div>
      <svg
        width={240}
        height={240}
        viewBox="0 0 240 240"
        style={{
          position: "absolute",
          left: 670,
          top: 1330,
          scale: String(sunIn),
          rotate: `${(frame / fps) * 20}deg`,
          filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.3))",
        }}
      >
        {new Array(12).fill(true).map((_, i) => (
          <line
            key={i}
            x1={120}
            y1={22}
            x2={120}
            y2={50}
            stroke={sunColor}
            strokeWidth={12}
            strokeLinecap="round"
            transform={`rotate(${i * 30} 120 120)`}
          />
        ))}
        <circle cx={120} cy={120} r={56} fill={sunColor} stroke={ink} strokeWidth={6} />
      </svg>
      <svg
        width={240}
        height={240}
        viewBox="0 0 240 240"
        style={{ position: "absolute", left: 670, top: 1330 }}
      >
        <line
          x1={30}
          y1={30}
          x2={210}
          y2={210}
          stroke={stampRed}
          strokeWidth={20}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - cross}
        />
        <line
          x1={210}
          y1={30}
          x2={30}
          y2={210}
          stroke={stampRed}
          strokeWidth={20}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - interpolate(frame, [crossAt + 4, crossAt + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </svg>
    </div>
  );
};
