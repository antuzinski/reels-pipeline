import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  // Local frames where each beat starts
  readonly ashAt: number; // "шапка вулканического пепла накрывает Англию"
  readonly pompeiiAt: number; // "и получается такой природный катаклизм"
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Full-screen cutaway: erupting volcano → ash buries the frame → Pompeii,
// with camera shake that grows with each beat.
export const Cataclysm: React.FC<Props> = ({ ashAt, pompeiiAt }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const shakeAmp = interpolate(
    frame,
    [0, 4, ashAt, pompeiiAt, pompeiiAt + 6, durationInFrames - 10],
    [26, 8, 12, 14, 30, 12],
    clamp,
  );
  const shakeX = (random(`sx-${frame}`) - 0.5) * shakeAmp;
  const shakeY = (random(`sy-${frame}`) - 0.5) * shakeAmp;

  // Ash darkness builds up until the Pompeii beat, then lifts a little
  const darkness = interpolate(
    frame,
    [ashAt - 10, pompeiiAt - 6, pompeiiAt + 4, durationInFrames],
    [0, 0.88, 0.25, 0.35],
    clamp,
  );
  const ashDensity = interpolate(
    frame,
    [0, ashAt, pompeiiAt - 6, durationInFrames],
    [0.25, 0.5, 1, 0.7],
    clamp,
  );
  const fade = interpolate(
    frame,
    [0, 3, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const flash = interpolate(frame, [0, 2, 8], [0, 0.85, 0], clamp);
  const pompeiiIn = interpolate(frame, [pompeiiAt - 4, pompeiiAt + 4], [0, 1], clamp);
  const lavaFlicker = 0.12 + random(`flicker-${Math.floor(frame / 2)}`) * 0.14;

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden", backgroundColor: "black" }}>
      <AbsoluteFill style={{ translate: `${shakeX}px ${shakeY}px`, scale: "1.06" }}>
        {/* Volcano: Volaire, Eruption of Vesuvius — crater pushed to the centre */}
        <Img
          src={staticFile("graphics/vesuvius-volaire-large.jpg")}
          style={{
            position: "absolute",
            height: 1920,
            width: 3220,
            left: -555,
            top: 0,
            transformOrigin: "1095px 700px",
            scale: String(
              interpolate(frame, [0, pompeiiAt], [1, 1.3], {
                ...clamp,
                easing: Easing.in(Easing.quad),
              }),
            ),
          }}
        />
        {/* Pompeii: Bryullov, The Last Day of Pompeii */}
        <Img
          src={staticFile("graphics/pompeii-bryullov-large.jpg")}
          style={{
            position: "absolute",
            height: 1920,
            width: 2558,
            left: -540,
            top: 0,
            opacity: pompeiiIn,
            transformOrigin: "1080px 900px",
            scale: String(
              interpolate(frame, [pompeiiAt, durationInFrames], [1.05, 1.22], clamp),
            ),
          }}
        />
        {/* Lava glow flicker */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(255,90,20,0.55), rgba(120,0,0,0) 60%)",
            opacity: lavaFlicker,
            mixBlendMode: "screen",
          }}
        />
        {/* Ash darkness */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(30,28,26,1) 0%, rgba(55,52,48,0.95) 55%, rgba(80,76,70,0.9) 100%)",
            opacity: darkness,
          }}
        />
      </AbsoluteFill>

      <AshStorm density={ashDensity} />

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

const COUNT = 260;

// Full-frame ash blowing diagonally; density 0..1 controls how many flakes are visible
const AshStorm: React.FC<{ readonly density: number }> = ({ density }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill>
      {new Array(COUNT).fill(true).map((_, i) => {
        if (random(`storm-on-${i}`) > density) return null;
        const size = 4 + random(`storm-size-${i}`) * 16;
        const speed = 260 + random(`storm-speed-${i}`) * 420;
        const y = ((random(`storm-y-${i}`) * 2100 + t * speed) % 2100) - 90;
        const x =
          ((random(`storm-x-${i}`) * 1300 - t * speed * 0.35) % 1300 + 1300) % 1300 - 110;
        const light = random(`storm-c-${i}`);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size * 0.75,
              borderRadius: "50%",
              backgroundColor: light > 0.85 ? "#9d978d" : light > 0.4 ? "#6b665f" : "#3d3a36",
              opacity: 0.5 + random(`storm-o-${i}`) * 0.45,
              filter: size > 14 ? "blur(2px)" : "blur(0.8px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
