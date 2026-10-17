import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { handFont, ink } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useDoodleMotion = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 10, mass: 0.6 } });
  const opacity = interpolate(frame, [0, 3, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], clamp);
  // Line boil seed, like the monocle guy
  const seed = Math.floor(frame / 4);
  const w = (n: number) => Math.sin(seed * 12.9898 + n * 78.233) * 2.2;
  return { frame, fps, enter, opacity, w };
};

// Primitive hand-drawn ghost saying "бу!" ("написать страшилку")
export const Ghost: React.FC<{ readonly x: number; readonly y: number }> = ({ x, y }) => {
  const { frame, fps, enter, opacity, w } = useDoodleMotion();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        scale: String(enter),
        translate: `0px ${Math.sin((frame / fps) * 3) * 14}px`,
      }}
    >
      <svg width={260} height={300} viewBox="0 0 260 300" style={{ overflow: "visible" }}>
        <g stroke={ink} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
          <path
            d={`M40 ${270 + w(1)} L40 120 Q40 ${30 + w(2)} 130 30 Q220 ${30 + w(3)} 220 120 L220 ${270 + w(4)} L190 ${245 + w(5)} L160 ${272 + w(6)} L130 ${245 + w(7)} L100 ${272 + w(8)} L70 ${245 + w(9)} Z`}
            fill="white"
          />
          <ellipse cx={100 + w(10)} cy={120} rx={14} ry={20} fill={ink} />
          <ellipse cx={160 + w(11)} cy={120} rx={14} ry={20} fill={ink} />
          <ellipse cx={130} cy={185} rx={18 + w(12)} ry={24} fill={ink} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 10,
          fontFamily: handFont,
          fontWeight: 700,
          fontSize: 84,
          color: "white",
          WebkitTextStroke: `4px ${ink}`,
          paintOrder: "stroke fill",
          rotate: "12deg",
        }}
      >
        бу!
      </div>
    </div>
  );
};

// Flat golden trophy with a question mark ("чья покажется нам лучшей, тот и победил")
export const Trophy: React.FC<{ readonly x: number; readonly y: number }> = ({ x, y }) => {
  const { frame, fps, enter, opacity, w } = useDoodleMotion();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        scale: String(enter),
        rotate: `${Math.sin((frame / fps) * 4) * 4}deg`,
      }}
    >
      <svg width={280} height={320} viewBox="0 0 280 320">
        <g stroke={ink} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round">
          <path d={`M60 40 L220 ${40 + w(1)} Q215 190 140 205 Q65 190 60 40 Z`} fill="#ffd60a" />
          <path d={`M60 70 Q10 70 20 120 Q30 160 75 150`} fill="none" />
          <path d={`M220 70 Q270 70 260 120 Q250 160 205 150`} fill="none" />
          <path d={`M125 205 L155 205 L160 255 L120 255 Z`} fill="#ffd60a" />
          <path d={`M80 255 L200 ${255 + w(2)} L210 300 L70 300 Z`} fill="#8a5a2b" />
        </g>
        <text
          x={140}
          y={160}
          textAnchor="middle"
          fontFamily={handFont}
          fontWeight={700}
          fontSize={110}
          fill={ink}
        >
          ?
        </text>
      </svg>
    </div>
  );
};
