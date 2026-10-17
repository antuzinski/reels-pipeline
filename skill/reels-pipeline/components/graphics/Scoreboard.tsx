import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { handFont, ink, paper, stampRed } from "./fonts";
import { MonocleGuy } from "./MonocleGuy";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const results = [
  { src: "graphics/mary-shelley-large.jpg", pos: "52% 22%", mark: "★", color: "#ffb703" },
  { src: "graphics/polidori.jpg", pos: "50% 16%", mark: "★", color: "#ffb703" },
  { src: "graphics/byron.jpg", pos: "50% 14%", mark: "✗", color: stampRed },
];

// Final score of the bet in the bottom third, monocle guy winks
export const Scoreboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <div style={{ position: "absolute", left: 60, top: 1330, display: "flex", gap: 26 }}>
        {results.map((r, i) => {
          const pop = spring({ frame: frame - i * 3, fps, config: { damping: 10 } });
          const markPop = spring({ frame: frame - 8 - i * 3, fps, config: { damping: 8 } });
          return (
            <div key={r.src} style={{ position: "relative", scale: String(pop), rotate: `${(i - 1) * 4}deg` }}>
              <div style={{ backgroundColor: "white", padding: 7, borderRadius: 6, boxShadow: "0 8px 18px rgba(0,0,0,0.4)" }}>
                <Img
                  src={staticFile(r.src)}
                  style={{
                    display: "block",
                    width: 170,
                    height: 210,
                    objectFit: "cover",
                    objectPosition: r.pos,
                    filter: "sepia(0.4)",
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: -18,
                  top: -26,
                  scale: String(markPop),
                  fontSize: 90,
                  lineHeight: 1,
                  color: r.color,
                  fontFamily: handFont,
                  fontWeight: 700,
                  WebkitTextStroke: `4px ${ink}`,
                  paintOrder: "stroke fill",
                }}
              >
                {r.mark}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 1600,
          padding: "4px 18px",
          backgroundColor: paper,
          color: ink,
          fontFamily: handFont,
          fontWeight: 700,
          fontSize: 44,
          borderRadius: 4,
        }}
      >
        Итог пари, 1816
      </div>
      <MonocleGuy x={700} y={1330} mood="wink" reactAt={8} size={0.75} enter="right" />
    </div>
  );
};
