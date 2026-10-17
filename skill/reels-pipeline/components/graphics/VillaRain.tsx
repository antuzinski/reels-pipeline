import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { handFont, paper } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const guests = [
  { src: "graphics/byron.jpg", pos: "50% 14%", name: "Байрон" },
  { src: "graphics/polidori.jpg", pos: "50% 16%", name: "Полидори" },
  { src: "graphics/percy-shelley.jpg", pos: "50% 20%", name: "Перси" },
  { src: "graphics/mary-shelley-large.jpg", pos: "52% 22%", name: "Мэри" },
];

// Full-screen "Day 47" meme: rainy window at Villa Diodati, four bored guests snoozing
export const VillaRain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, 5, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], clamp);
  const title = spring({ frame: frame - 3, fps, config: { damping: 13 } });

  return (
    <AbsoluteFill
      style={{
        opacity: fade,
        background: "linear-gradient(180deg, #2c3540 0%, #3c4652 55%, #252c35 100%)",
        overflow: "hidden",
      }}
    >
      {/* Rain */}
      {new Array(140).fill(true).map((_, i) => {
        const speed = 1400 + random(`rain-s-${i}`) * 900;
        const len = 40 + random(`rain-l-${i}`) * 70;
        const y = ((random(`rain-y-${i}`) * 2100 + t * speed) % 2100) - 120;
        const x = random(`rain-x-${i}`) * 1180 - 50 - (y + 120) * 0.12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 3,
              height: len,
              backgroundColor: "rgba(200, 220, 240, 0.35)",
              rotate: "7deg",
              borderRadius: 2,
            }}
          />
        );
      })}
      {/* Window frame */}
      <AbsoluteFill style={{ border: "46px solid #3b2a1e", boxShadow: "inset 0 0 60px rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", left: 517, top: 0, width: 46, height: 1920, backgroundColor: "#3b2a1e" }} />
      <div style={{ position: "absolute", left: 0, top: 960, width: 1080, height: 40, backgroundColor: "#3b2a1e" }} />

      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: handFont,
          fontWeight: 700,
          color: paper,
          textShadow: "0 6px 18px rgba(0,0,0,0.6)",
          scale: String(title),
        }}
      >
        <div style={{ fontSize: 76 }}>Вилла Диодати, 1816</div>
        <div style={{ fontSize: 120, color: "#ffd60a" }}>День 47-й. Дождь.</div>
      </div>

      {/* Bored guests */}
      <div
        style={{
          position: "absolute",
          top: 1320,
          left: 70,
          right: 70,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {guests.map((g, i) => {
          const pop = spring({ frame: frame - 8 - i * 4, fps, config: { damping: 11 } });
          const sway = Math.sin(t * 1.4 + i * 1.7) * 4;
          return (
            <div
              key={g.name}
              style={{
                position: "relative",
                scale: String(pop),
                rotate: `${sway}deg`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  padding: 7,
                  borderRadius: 6,
                  boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
                }}
              >
                <Img
                  src={staticFile(g.src)}
                  style={{
                    display: "block",
                    width: 190,
                    height: 230,
                    objectFit: "cover",
                    objectPosition: g.pos,
                    filter: "sepia(0.5) saturate(0.7) brightness(0.9)",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: handFont,
                  fontWeight: 700,
                  fontSize: 40,
                  color: paper,
                }}
              >
                {g.name}
              </div>
              {/* zzz */}
              {[0, 1, 2].map((z) => {
                const p = ((t + i * 0.37 + z * 0.45) % 1.35) / 1.35;
                return (
                  <div
                    key={z}
                    style={{
                      position: "absolute",
                      right: -10 - p * 30,
                      top: -20 - p * 90,
                      fontFamily: handFont,
                      fontWeight: 700,
                      fontSize: 36 + z * 10,
                      color: "white",
                      opacity: Math.sin(p * Math.PI),
                    }}
                  >
                    z
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
