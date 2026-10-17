import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { handFont, ink, paper } from "./fonts";

type Props = {
  // Local frame where the picture freezes (record scratch)
  readonly freezeAt: number;
  readonly text: string;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// "Record scratch, freeze frame" meme: Byron slowly pushes in looking smug,
// then everything stops, jolts, goes sepia and a narrator caption appears.
export const FreezeFrame: React.FC<Props> = ({ freezeAt, text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const frozen = frame >= freezeAt;
  const pushFrame = Math.min(frame, freezeAt);
  const jolt = frozen ? interpolate(frame, [freezeAt, freezeAt + 2, freezeAt + 6], [1.08, 1.03, 1], clamp) : 1;
  const sepia = interpolate(frame, [freezeAt, freezeAt + 3], [0, 1], clamp);
  const caption = spring({ frame: frame - freezeAt - 3, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        overflow: "hidden",
        opacity: interpolate(frame, [0, 3, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], clamp),
      }}
    >
      <Img
        src={staticFile("graphics/byron-large.jpg")}
        style={{
          position: "absolute",
          height: 1920,
          width: 1574,
          left: -208,
          top: 0,
          transformOrigin: "748px 700px",
          scale: String(interpolate(pushFrame, [0, freezeAt], [1.15, 1.35], clamp) * jolt),
          filter: `sepia(${sepia}) contrast(${1 + sepia * 0.15}) brightness(${1 - sepia * 0.05})`,
        }}
      />
      {/* Film-still border flash on freeze */}
      <AbsoluteFill
        style={{
          backgroundColor: "white",
          opacity: interpolate(frame, [freezeAt, freezeAt + 1, freezeAt + 5], [0, 0.7, 0], clamp),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1330,
          opacity: caption,
          translate: `0px ${(1 - caption) * 40}px`,
          padding: "22px 34px",
          backgroundColor: paper,
          color: ink,
          fontFamily: handFont,
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.15,
          textAlign: "center",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          rotate: "-1.5deg",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
