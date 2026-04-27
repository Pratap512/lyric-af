import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { LyricTemplateProps } from "./types";
import { AssetBackground } from "../components/AssetBackground";
import { AudioTrack } from "../components/AudioTrack";
import { useLineActive } from "../components/TimedLyricLine";

export function KaraokeHighlight({ lyrics, audioUrl, backgroundAssetUrl, style }: LyricTemplateProps) {
  return (
    <AbsoluteFill>
      <AssetBackground url={backgroundAssetUrl} />
      <AudioTrack audioUrl={audioUrl} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.35em",
            maxWidth: "90%",
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {lyrics.map((line, index) => (
            <KaraokeWord
              key={`${line.text}-${index}`}
              line={line}
              primaryColor={style.primaryColor}
              secondaryColor={style.secondaryColor}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function KaraokeWord({
  line,
  primaryColor,
  secondaryColor,
}: {
  line: LyricTemplateProps["lyrics"][number];
  primaryColor: string;
  secondaryColor: string;
}) {
  const frame = useCurrentFrame();
  const active = useLineActive(line);
  const startFrame = Math.round((line.startMs / 1000) * 30);
  const pop = active
    ? interpolate(frame - startFrame, [0, 6], [1, 1.08], { extrapolateRight: "clamp" })
    : 1;

  return (
    <span
      style={{
        color: active ? secondaryColor : primaryColor,
        opacity: active ? 1 : 0.45,
        transform: `scale(${pop})`,
        display: "inline-block",
        transition: "color 0.1s",
        textShadow: active ? `0 0 24px ${secondaryColor}88` : "none",
      }}
    >
      {line.text}
    </span>
  );
}
