import { AbsoluteFill, Img, Video } from "remotion";

interface AssetBackgroundProps {
  url?: string;
  fallbackColor?: string;
}

export function AssetBackground({ url, fallbackColor = "#0a0a0a" }: AssetBackgroundProps) {
  if (!url) {
    return <AbsoluteFill style={{ backgroundColor: fallbackColor }} />;
  }

  const isVideo = /\.(mp4|webm|mov)$/i.test(url);

  if (isVideo) {
    return (
      <AbsoluteFill>
        <Video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
    </AbsoluteFill>
  );
}
