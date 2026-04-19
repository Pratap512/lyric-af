import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function checkFfmpegAvailable(): Promise<void> {
  await execFileAsync("ffmpeg", ["-version"]);
}

export interface MuxOptions {
  videoPath: string;
  audioPath: string;
  outputPath: string;
  durationMs?: number;
}

export interface EncodeOptions {
  inputPath: string;
  outputPath: string;
  crf?: number;
  preset?: string;
  normalizeAudio?: boolean;
}

export async function muxVideoAudio(options: MuxOptions): Promise<void> {
  const args = [
    "-y",
    "-i", options.videoPath,
    "-i", options.audioPath,
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
  ];

  if (options.durationMs) {
    args.push("-t", String(options.durationMs / 1000));
  }

  args.push(options.outputPath);

  await execFileAsync("ffmpeg", args);
}

export async function encodeVideo(options: EncodeOptions): Promise<void> {
  const crf = options.crf ?? 23;
  const preset = options.preset ?? "medium";

  const args = [
    "-y",
    "-i", options.inputPath,
    "-c:v", "libx264",
    "-crf", String(crf),
    "-preset", preset,
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
  ];

  if (options.normalizeAudio) {
    args.push("-af", "loudnorm=I=-16:TP=-1.5:LRA=11");
  }

  args.push(options.outputPath);

  await execFileAsync("ffmpeg", args);
}

export async function postProcessRender(options: {
  rawVideoPath: string;
  audioPath: string;
  outputPath: string;
  durationMs?: number;
  normalizeAudio?: boolean;
}): Promise<void> {
  const muxedPath = options.outputPath.replace(/\.mp4$/, "-muxed.mp4");

  await muxVideoAudio({
    videoPath: options.rawVideoPath,
    audioPath: options.audioPath,
    outputPath: muxedPath,
    durationMs: options.durationMs,
  });

  await encodeVideo({
    inputPath: muxedPath,
    outputPath: options.outputPath,
    normalizeAudio: options.normalizeAudio ?? true,
  });

  const { unlink } = await import("node:fs/promises");
  await unlink(muxedPath).catch(() => undefined);
}
