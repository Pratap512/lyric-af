import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { LyricTemplateProps } from "../types";
import { AssetBackground } from "../components/AssetBackground";
import { AudioTrack } from "../components/AudioTrack";
import { msToFrames } from "../types";

export function ScrollLyrics({ lyrics, audioUrl, backgroundAssetUrl, style }: LyricTemplateProps) {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <AssetBackground url={backgroundAssetUrl} />
      <AudioTrack audioUrl={audioUrl} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 120px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}>
          {lyrics.map((line, index) => {
            const startFrame = msToFrames(line.startMs);
            const endFrame = msToFrames(line.endMs);
            const fadeIn = interpolate(frame, [startFrame - 8, startFrame], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(frame, [endFrame - 8, endFrame], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const opacity = frame < startFrame ? 0 : Math.min(fadeIn, fadeOut);
            const translateY = interpolate(
              frame,
              [startFrame - 8, startFrame, endFrame, endFrame + 8],
              [30, 0, 0, -30],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const isActive = frame >= startFrame && frame < endFrame;

            return (
              <div
                key={`${line.text}-${index}`}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: isActive ? style.fontSize * 1.1 : style.fontSize * 0.85,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? style.secondaryColor : style.primaryColor,
                  opacity: opacity * (isActive ? 1 : 0.55),
                  transform: `translateY(${translateY}px)`,
                  textAlign: "center",
                  textShadow: isActive ? `0 4px 32px ${style.secondaryColor}66` : "none",
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
