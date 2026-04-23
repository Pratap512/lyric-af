import { Composition } from "remotion";
import { KaraokeHighlight } from "./templates/KaraokeHighlight";
import { ScrollLyrics } from "./templates/ScrollLyrics";
import { FPS, HEIGHT, WIDTH, getDurationMs } from "./types";
import type { LyricTemplateProps } from "./types";

const sampleLyrics: LyricTemplateProps["lyrics"] = [
  { text: "Hello", startMs: 0, endMs: 800 },
  { text: "from", startMs: 800, endMs: 1400 },
  { text: "the", startMs: 1400, endMs: 1800 },
  { text: "other", startMs: 1800, endMs: 2400 },
  { text: "side", startMs: 2400, endMs: 3200 },
];

const defaultStyle: LyricTemplateProps["style"] = {
  primaryColor: "#ffffff",
  secondaryColor: "#ffcc00",
  fontFamily: "Inter, sans-serif",
  fontSize: 56,
};

const defaultProps: LyricTemplateProps = {
  lyrics: sampleLyrics,
  audioUrl: "",
  style: defaultStyle,
};

export const RemotionRoot: React.FC = () => {
  const durationMs = getDurationMs(sampleLyrics);

  return (
    <>
      <Composition
        id="KaraokeHighlight"
        component={KaraokeHighlight}
        durationInFrames={Math.ceil((durationMs / 1000) * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaultProps}
      />
      <Composition
        id="ScrollLyrics"
        component={ScrollLyrics}
        durationInFrames={Math.ceil((durationMs / 1000) * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          ...defaultProps,
          style: { ...defaultStyle, secondaryColor: "#a0a0ff", fontSize: 42 },
        }}
      />
    </>
  );
};
