import { useCurrentFrame } from "remotion";
import type { LyricLine } from "../types";
import { msToFrames } from "../types";

interface TimedLyricLineProps {
  line: LyricLine;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function TimedLyricLine({ line, style, children }: TimedLyricLineProps) {
  const frame = useCurrentFrame();
  const startFrame = msToFrames(line.startMs);
  const endFrame = msToFrames(line.endMs);
  const visible = frame >= startFrame && frame < endFrame;

  if (!visible) return null;

  return (
    <div style={style}>
      {children ?? line.text}
    </div>
  );
}

export function useLineActive(line: LyricLine): boolean {
  const frame = useCurrentFrame();
  const startFrame = msToFrames(line.startMs);
  const endFrame = msToFrames(line.endMs);
  return frame >= startFrame && frame < endFrame;
}
