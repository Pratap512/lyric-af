import { Audio } from "remotion";

interface AudioTrackProps {
  audioUrl: string;
}

export function AudioTrack({ audioUrl }: AudioTrackProps) {
  if (!audioUrl) return null;
  return <Audio src={audioUrl} />;
}
