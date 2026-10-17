import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { handFont, ink } from "./fonts";

export type MonocleMood = "bored" | "shocked" | "disgusted" | "approve" | "wink";

type Props = {
  readonly x: number;
  readonly y: number;
  readonly mood: MonocleMood;
  // Local frame of the reaction: yawn, monocle drop, nod, wink...
  readonly reactAt: number;
  readonly bubble?: string;
  readonly bubbleSide?: "left" | "right";
  readonly size?: number; // scale, 1 = 300px wide
  readonly enter?: "right" | "left" | "fade";
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Deliberately primitive black-and-white meme gentleman with a top hat and monocle.
// Lines wobble every few frames to look hand-drawn ("line boil").
export const MonocleGuy: React.FC<Props> = ({
  x,
  y,
  mood,
  reactAt,
  bubble,
  bubbleSide = "left",
  size = 1,
  enter = "right",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enterProgress = spring({ frame, fps, config: { damping: 14 } });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const slide = enter === "fade" ? 0 : (enter === "right" ? 1 : -1) * 520;
  const react = interpolate(frame, [reactAt, reactAt + 6], [0, 1], clamp);
  const yawn = interpolate(
    frame,
    [reactAt, reactAt + 8, reactAt + 26, reactAt + 34],
    [0, 1, 1, 0],
    clamp,
  );
  const monocleDrop =
    mood === "shocked"
      ? spring({ frame: frame - reactAt, fps, config: { damping: 7, mass: 0.8 } })
      : 0;
  const nod =
    mood === "approve" && frame > reactAt
      ? Math.sin(((frame - reactAt) / fps) * Math.PI * 4) *
        interpolate(frame, [reactAt, reactAt + 30], [8, 0], clamp)
      : 0;
  const bubbleIn = spring({ frame: frame - reactAt + 4, fps, config: { damping: 12 } });
  // Line boil: change the wobble seed every 4 frames
  const seed = Math.floor(frame / 4);
  const w = (n: number) => Math.sin(seed * 12.9898 + n * 78.233) * 2.2;

  const leftEye =
    mood === "shocked" ? (
      <circle cx={112} cy={192} r={6 + react * 8} fill="white" />
    ) : mood === "approve" || mood === "wink" ? (
      <path d={`M96 ${200 + w(11)} Q112 ${184 - react * 4} 128 ${200 + w(12)}`} fill="none" />
    ) : mood === "disgusted" ? (
      <path d={`M96 ${188 + w(11)} L128 ${198 + w(12)}`} />
    ) : (
      <path d={`M96 ${196 + w(11)} L128 ${196 + w(12)}`} />
    );

  const mouth =
    mood === "bored" ? (
      <ellipse cx={150} cy={284} rx={16 + yawn * 10} ry={3 + yawn * 26} fill={ink} />
    ) : mood === "shocked" ? (
      <ellipse cx={150} cy={288} rx={10 + react * 10} ry={6 + react * 22} fill={ink} />
    ) : mood === "disgusted" ? (
      <path
        d={`M118 ${290 + w(18)} Q134 ${276 - react * 6} 150 290 Q166 ${304 + react * 6} 182 ${284 + w(19)}`}
        fill="none"
      />
    ) : (
      <path d={`M120 280 Q150 ${300 + react * 14} 180 280`} fill="none" />
    );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 300,
        height: 380,
        transformOrigin: "0 0",
        scale: String(size),
        translate: `${(1 - enterProgress) * slide + exit * (slide || 0)}px 0px`,
        opacity: enter === "fade" ? Math.min(enterProgress * 1.5, 1 - exit) : 1,
        rotate: `${Math.sin((frame / fps) * 3) * 2 + nod}deg`,
      }}
    >
      <svg width={300} height={380} viewBox="0 0 300 380" style={{ overflow: "visible" }}>
        <g fill="white" stroke={ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
          {/* top hat */}
          <path
            d={`M${92 + w(1)} 120 L${104 + w(2)} 20 L${200 + w(3)} 22 L${208 + w(4)} 122 Z`}
            fill={ink}
            transform={mood === "shocked" ? `translate(0 ${-react * 18})` : undefined}
          />
          <path
            d={`M${60 + w(5)} 124 Q150 ${108 + w(6)} ${240 + w(7)} 124`}
            fill="none"
            strokeWidth={10}
            transform={mood === "shocked" ? `translate(0 ${-react * 18})` : undefined}
          />
          {/* head */}
          <ellipse cx={150 + w(8)} cy={210} rx={92 + w(9)} ry={98 + w(10)} />
          {leftEye}
          {/* monocle + chain (drops on "shocked") */}
          <g transform={`translate(${monocleDrop * 8} ${monocleDrop * 130}) rotate(${monocleDrop * 25} 192 194)`}>
            <circle cx={192 + w(13)} cy={192} r={24} fill="white" />
            {mood === "wink" ? (
              <path d={`M178 ${196 - react * 2} L206 ${196 + w(20)}`} />
            ) : (
              <circle cx={192} cy={194} r={mood === "shocked" ? 9 : 5} fill={ink} />
            )}
          </g>
          <path d={`M${206} 214 Q${236 + w(14)} 270 ${214} 330`} fill="none" strokeWidth={4} />
          {/* mustache */}
          <path
            d={`M${104} ${256 + w(15)} Q128 236 150 252 Q172 236 196 ${256 + w(16)}`}
            fill="none"
          />
          {mouth}
          {/* collar */}
          <path d={`M${92} 300 L${150 + w(17)} 360 L${208} 300`} fill="none" />
        </g>
      </svg>
      {bubble ? (
        <div
          style={{
            position: "absolute",
            top: 20,
            ...(bubbleSide === "left" ? { right: 270 } : { left: 270 }),
            scale: String(bubbleIn),
            padding: "10px 22px",
            backgroundColor: "white",
            border: `5px solid ${ink}`,
            borderRadius: 40,
            fontFamily: handFont,
            fontWeight: 700,
            fontSize: 50,
            color: ink,
            whiteSpace: "nowrap",
          }}
        >
          {bubble}
        </div>
      ) : null}
    </div>
  );
};
