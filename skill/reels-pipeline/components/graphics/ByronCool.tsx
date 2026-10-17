import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { handFont, ink, paper } from "./fonts";

type Props = {
  readonly x: number;
  readonly y: number;
  // Local frame where the pixel sunglasses land ("Байрон мухлевал")
  readonly glassesAt: number;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// "Deal with it" pixel sunglasses: 1 = black, 2 = white glint
const PIXELS = [
  "1111111111111111111",
  "0112211110112211110",
  "0111221100111221100",
  "0011111000011111000",
];
const PX = 9;

// Byron sticker (engraving crop) on which meme pixel sunglasses slowly drop
export const ByronCool: React.FC<Props> = ({ x, y, glassesAt }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 11, mass: 0.7 } });
  const drop = interpolate(frame, [glassesAt, glassesAt + 18], [-260, 0], {
    ...clamp,
    easing: Easing.linear,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        scale: String(0.55 + 0.45 * enter),
        rotate: "-4deg",
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
          height: 360,
          border: "10px solid white",
          borderRadius: 6,
          boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
          overflow: "hidden",
          backgroundColor: "white",
        }}
      >
        {/* byron-large.jpg at 50%: face centre (374, 275) → (150, 170) in the frame */}
        <Img
          src={staticFile("graphics/byron-large.jpg")}
          style={{ position: "absolute", width: 800, height: 976, left: -224, top: -105, filter: "sepia(0.35)" }}
        />
        <svg
          width={PIXELS[0].length * PX}
          height={PIXELS.length * PX}
          style={{ position: "absolute", left: 68, top: 138, translate: `0px ${drop}px`, rotate: "-6deg" }}
        >
          {PIXELS.flatMap((row, r) =>
            row.split("").map((c, i) =>
              c === "0" ? null : (
                <rect
                  key={`${r}-${i}`}
                  x={i * PX}
                  y={r * PX}
                  width={PX}
                  height={PX}
                  fill={c === "1" ? "#000" : "#fff"}
                />
              ),
            ),
          )}
        </svg>
      </div>
      <div
        style={{
          marginTop: -14,
          padding: "4px 18px",
          backgroundColor: paper,
          color: ink,
          fontFamily: handFont,
          fontWeight: 700,
          fontSize: 42,
          borderRadius: 4,
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          rotate: "2deg",
          opacity: interpolate(frame, [glassesAt + 18, glassesAt + 24], [0, 1], clamp),
        }}
      >
        Байрон уверен в победе
      </div>
    </div>
  );
};
