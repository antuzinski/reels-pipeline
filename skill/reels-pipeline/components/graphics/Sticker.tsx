import {
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { handFont, ink, paper } from "./fonts";

type StickerProps = {
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotate: number;
  readonly label?: string;
  readonly objectPosition?: string;
  readonly sepia?: number;
  // Slight softening for fine engravings that shimmer when scaled down
  readonly blur?: number;
};

// A historical image as a cut-out sticker: white border, soft shadow,
// springy entrance, gentle drift, quick fade-out at the end of its sequence.
export const Sticker: React.FC<StickerProps> = ({
  src,
  x,
  y,
  width,
  height,
  rotate,
  label,
  objectPosition = "50% 50%",
  sepia = 0.45,
  blur = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 11, mass: 0.7 } });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        scale: String(0.55 + 0.45 * enter),
        rotate: `${rotate + (1 - enter) * (rotate < 0 ? -14 : 14)}deg`,
        translate: `0px ${Math.sin((frame / fps) * 2.2) * 6}px`,
        opacity: interpolate(
          frame,
          [0, 4, durationInFrames - 8, durationInFrames],
          [0, 1, 1, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          },
        ),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 10,
          borderRadius: 6,
          boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35)",
        }}
      >
        <Img
          src={src}
          style={{
            display: "block",
            width,
            height,
            objectFit: "cover",
            objectPosition,
            filter: `sepia(${sepia}) contrast(1.05) blur(${blur}px)`,
          }}
        />
      </div>
      {label ? (
        <div
          style={{
            marginTop: -14,
            padding: "4px 18px",
            backgroundColor: paper,
            color: ink,
            fontFamily: handFont,
            fontWeight: 700,
            fontSize: 42,
            lineHeight: 1.1,
            borderRadius: 4,
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
            rotate: `${-rotate * 0.6}deg`,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
