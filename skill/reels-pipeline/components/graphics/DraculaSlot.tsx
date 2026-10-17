import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { handFont, paper } from "./fonts";

type Props = {
  // File in public/, e.g. staticFile("dracula.mp4"); null until the user provides a clip
  readonly src: string | null;
  readonly trimBefore?: number;
  readonly mirror?: boolean;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Full-screen "new vampire": a clip from Bram Stoker's Dracula (1992).
// Shows a placeholder card until the clip is added.
export const DraculaSlot: React.FC<Props> = ({ src, trimBefore = 0, mirror = false }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 4, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: "#120607" }}>
      {src ? (
        <Video
          src={src}
          trimBefore={trimBefore}
          muted
          premountFor={fps}
          objectFit="cover"
          style={{ width: "100%", height: "100%", scale: mirror ? "-1 1" : "1" }}
        />
      ) : (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: 80,
            fontFamily: handFont,
            fontWeight: 700,
            fontSize: 64,
            color: paper,
            border: "8px dashed rgba(243,234,215,0.4)",
          }}
        >
          Здесь будет фрагмент из «Дракулы» (1992)
        </AbsoluteFill>
      )}
      {/* Colour grade: warm highlights, teal-ish shadows, slightly darker edges */}
      <AbsoluteFill style={{ backgroundColor: "rgb(255, 150, 70)", mixBlendMode: "soft-light", opacity: 0.35 }} />
      <AbsoluteFill style={{ backgroundColor: "rgb(20, 70, 90)", mixBlendMode: "lighten", opacity: 0.12 }} />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }}
      />
      {src ? (
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
          вампир после 1819-го
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
