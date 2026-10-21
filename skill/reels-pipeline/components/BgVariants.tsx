import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,

  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { serifFont, stampFont } from "./graphics/fonts";

// Background replacement test on a matted talking head (@remotion/video-matting):
// layer 1 = new background, layer 2 = person with alpha (fg.webm), optional layers in between.
export type BgVariant =
  | "original" | "blur" | "spotlight" | "solid" | "gradient" | "painting"
  | "text-behind" | "rays" | "outline" | "parallax" | "duotone" | "swap";

type Props = { readonly variant: BgVariant; readonly fg: string; readonly src: string; readonly startFrom?: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const LABELS: Record<BgVariant, string> = {
  original: "Оригинал",
  blur: "Размытый фон (боке)",
  spotlight: "Фон темнее и ч/б, человек в цвете",
  solid: "Однотонный фон",
  gradient: "Живой градиент",
  painting: "Картина / фото за спиной",
  "text-behind": "Текст за головой",
  rays: "Графика за спиной (лучи)",
  outline: "Человек-стикер с обводкой",
  parallax: "Фон и человек двигаются отдельно",
  duotone: "Стилизация фона (дуотон)",
  swap: "Смена фона по ходу",
};

const Person: React.FC<{ readonly fg: string; readonly startFrom: number; readonly style?: React.CSSProperties }> = ({ fg, startFrom, style }) => (
  <OffthreadVideo
    src={staticFile(fg)}
    transparent
    muted
    startFrom={startFrom}
    style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", ...style }}
  />
);

const Original: React.FC<{ readonly src: string; readonly startFrom: number; readonly style?: React.CSSProperties; readonly muted?: boolean }> = ({ src, startFrom, style, muted }) => (
  <OffthreadVideo
    src={staticFile(src)}
    muted={muted}
    startFrom={startFrom}
    style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", ...style }}
  />
);

export const BgVariantScene: React.FC<Props> = ({ variant, fg, src, startFrom = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  let back: React.ReactNode = null;
  let between: React.ReactNode = null;
  let personStyle: React.CSSProperties | undefined;

  switch (variant) {
    case "original":
      return (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
          <Original src={src} startFrom={startFrom} />
          <Label text={LABELS[variant]} />
        </AbsoluteFill>
      );
    case "blur":
      back = <Original src={src} startFrom={startFrom} muted style={{ filter: "blur(18px) brightness(0.95)", scale: "1.08" }} />;
      break;
    case "spotlight":
      back = <Original src={src} startFrom={startFrom} muted style={{ filter: "grayscale(1) brightness(0.45) contrast(1.1)" }} />;
      between = <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, rgba(255,220,160,0.25), rgba(0,0,0,0) 55%)" }} />;
      break;
    case "solid":
      back = <AbsoluteFill style={{ backgroundColor: "#1f3a5f" }} />;
      break;
    case "gradient":
      back = (
        <AbsoluteFill
          style={{
            background: `linear-gradient(${interpolate(frame, [0, durationInFrames], [120, 240])}deg, #ff7a59, #7c5cff 50%, #22d3ee)`,
          }}
        />
      );
      break;
    case "painting":
      back = (
        <Img
          src={staticFile("graphics/pompeii-bryullov-large.jpg")}
          style={{
            position: "absolute", height: 1920, width: 2558, left: -740, top: 0,
            scale: String(interpolate(frame, [0, durationInFrames], [1.05, 1.15], clamp)),
            filter: "brightness(0.8)",
          }}
        />
      );
      break;
    case "text-behind":
      back = <AbsoluteFill style={{ backgroundColor: "#f3ead7" }} />;
      between = (
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: 230, textAlign: "center",
            fontFamily: serifFont, fontWeight: 900, fontSize: 420, lineHeight: 1, color: "#2b2118",
            translate: `0px ${interpolate(frame, [0, 12], [80, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}px`,
            opacity: interpolate(frame, [0, 8], [0, 1], clamp),
          }}
        >
          1816
        </div>
      );
      break;
    case "rays":
      back = <AbsoluteFill style={{ backgroundColor: "#ffcf4a" }} />;
      between = (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <g transform={`rotate(${t * 12} 540 620)`}>
            {new Array(18).fill(true).map((_, i) => (
              <path key={i} d="M540 620 L470 -900 L610 -900 Z" fill="#ffb000" transform={`rotate(${i * 20} 540 620)`} />
            ))}
          </g>
        </svg>
      );
      break;
    case "outline":
      back = <AbsoluteFill style={{ background: "repeating-linear-gradient(45deg, #ffe066 0 40px, #ffd23f 40px 80px)" }} />;
      personStyle = { filter: "drop-shadow(0 0 0 white) drop-shadow(6px 0 0 white) drop-shadow(-6px 0 0 white) drop-shadow(0 6px 0 white) drop-shadow(0 -6px 0 white) drop-shadow(0 14px 24px rgba(0,0,0,0.35))" };
      break;
    case "parallax":
      back = (
        <Img
          src={staticFile("graphics/vesuvius-volaire-large.jpg")}
          style={{
            position: "absolute", height: 1920, width: 3220, top: 0,
            left: interpolate(frame, [0, durationInFrames], [-300, -800]),
            filter: "brightness(0.85)",
          }}
        />
      );
      personStyle = { scale: String(interpolate(frame, [0, durationInFrames], [1, 1.08])), transformOrigin: "50% 100%" };
      break;
    case "duotone":
      back = <Original src={src} startFrom={startFrom} muted style={{ filter: "grayscale(1) contrast(1.3) brightness(1.1)" }} />;
      between = <AbsoluteFill style={{ backgroundColor: "#7c5cff", mixBlendMode: "multiply", opacity: 0.85 }} />;
      break;
    case "swap": {
      const step = Math.floor(t / 0.7) % 3;
      back = (
        <AbsoluteFill style={{ backgroundColor: ["#e63946", "#2a9d8f", "#264653"][step] }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: "repeating-radial-gradient(circle at 50% 40%, #fff 0 4px, transparent 4px 40px)" }} />
        </AbsoluteFill>
      );
      break;
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      {back}
      {between}
      <Person fg={fg} startFrom={startFrom} style={personStyle} />
      {/* audio from the original */}
      <OffthreadVideo src={staticFile(src)} startFrom={startFrom} style={{ display: "none" }} />
      <Label text={LABELS[variant]} />
    </AbsoluteFill>
  );
};

const Label: React.FC<{ readonly text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute", left: 40, right: 40, bottom: 120, textAlign: "center",
      fontFamily: stampFont, fontWeight: 800, fontSize: 54, color: "white",
      textShadow: "0 3px 10px rgba(0,0,0,0.8)",
    }}
  >
    {text}
  </div>
);

export const BG_VARIANTS: BgVariant[] = [
  "original", "blur", "spotlight", "solid", "gradient", "painting",
  "text-behind", "rays", "outline", "parallax", "duotone", "swap",
];
const PER_VARIANT = 60; // 2 s each

// Showcase: every variant for 2 s, each on a different moment of the clip
export const BgShowcase: React.FC<{ readonly fg: string; readonly src: string }> = ({ fg, src }) => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      {BG_VARIANTS.map((v, i) => (
        <Series.Sequence key={v} name={v} durationInFrames={PER_VARIANT} premountFor={fps}>
          <BgVariantScene variant={v} fg={fg} src={src} startFrom={(i * PER_VARIANT) % 250} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
export const BG_SHOWCASE_FRAMES = BG_VARIANTS.length * PER_VARIANT;

