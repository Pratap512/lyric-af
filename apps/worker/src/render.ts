import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { eq } from "drizzle-orm";
import {
  lyricTemplatePropsSchema,
  templateParamsSchema,
  RENDER_FPS as FPS,
  getDurationMs,
  type LyricLine,
  type Template,
} from "@lyric-af/schemas";
import { createDatabase, schema } from "@lyric-af/schemas/db";
import { postProcessRender } from "@lyric-af/ffmpeg";
import { buildStorageKey, LocalStorageAdapter } from "@lyric-af/storage";
import { env } from "./config.js";

let dbInstance: ReturnType<typeof createDatabase> | null = null;

function db() {
  if (!dbInstance) {
    mkdirSync(dirname(env.databaseUrl), { recursive: true });
    dbInstance = createDatabase(env.databaseUrl);
  }
  return dbInstance;
}

const storage = new LocalStorageAdapter(env.storagePath, env.apiPublicUrl);

let bundled: string | null = null;

async function getBundleLocation(): Promise<string> {
  if (!bundled) {
    bundled = await bundle({
      entryPoint: env.remotionEntry,
      webpackOverride: (config) => config,
    });
  }
  return bundled;
}

function getDurationFromLyrics(lyrics: LyricLine[]): number {
  return getDurationMs(lyrics);
}

async function loadJobContext(jobId: string) {
  const jobRow = await db().query.renderJobs.findFirst({
    where: eq(schema.renderJobs.id, jobId),
  });
  if (!jobRow) throw new Error(`Render job ${jobId} not found`);

  const templateRow = await db().query.templates.findFirst({
    where: eq(schema.templates.id, jobRow.templateId),
  });
  if (!templateRow) throw new Error(`Template ${jobRow.templateId} not found`);

  const audioRow = await db().query.assets.findFirst({
    where: eq(schema.assets.id, jobRow.audioAssetId),
  });
  if (!audioRow) throw new Error(`Audio asset ${jobRow.audioAssetId} not found`);

  const params = templateParamsSchema.parse(jobRow.params);
  let backgroundAssetUrl: string | undefined;
  if (params.backgroundAssetId) {
    const bgRow = await db().query.assets.findFirst({
      where: eq(schema.assets.id, params.backgroundAssetId),
    });
    if (bgRow) {
      backgroundAssetUrl = storage.getUrl(bgRow.storageKey);
    }
  }

  return {
    job: jobRow,
    template: templateRow as typeof templateRow & { compositionId: string },
    audioPath: storage.getPath(audioRow.storageKey),
    audioUrl: storage.getUrl(audioRow.storageKey),
    backgroundAssetUrl,
    params,
    lyrics: jobRow.lyrics as LyricLine[],
  };
}

async function updateJob(
  jobId: string,
  update: Partial<typeof schema.renderJobs.$inferInsert>,
) {
  await db().update(schema.renderJobs)
    .set({ ...update, updatedAt: new Date().toISOString() })
    .where(eq(schema.renderJobs.id, jobId));
}

export async function processRenderJob(jobId: string): Promise<void> {
  mkdirSync(env.tmpDir, { recursive: true });

  const ctx = await loadJobContext(jobId);
  const rawPath = join(env.tmpDir, `${jobId}-raw.mp4`);
  const finalPath = join(env.tmpDir, `${jobId}-final.mp4`);

  try {
    await updateJob(jobId, { status: "rendering", progress: 5, error: null });

    const serveUrl = await getBundleLocation();
    const durationMs = getDurationFromLyrics(ctx.lyrics);
    const durationInFrames = Math.ceil((durationMs / 1000) * FPS);

    const inputProps = lyricTemplatePropsSchema.parse({
      lyrics: ctx.lyrics,
      audioUrl: ctx.audioUrl,
      backgroundAssetUrl: ctx.backgroundAssetUrl,
      style: {
        primaryColor: ctx.params.primaryColor,
        secondaryColor: ctx.params.secondaryColor,
        fontFamily: ctx.params.fontFamily,
        fontSize: ctx.params.fontSize,
      },
    });

    const composition = await selectComposition({
      serveUrl,
      id: ctx.template.compositionId,
      inputProps,
    });

    composition.durationInFrames = durationInFrames;

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: rawPath,
      inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 70);
        void updateJob(jobId, { progress: Math.max(5, pct) });
      },
    });

    await updateJob(jobId, { status: "post_processing", progress: 75 });

    await postProcessRender({
      rawVideoPath: rawPath,
      audioPath: ctx.audioPath,
      outputPath: finalPath,
      durationMs,
      normalizeAudio: true,
    });

    const outputKey = buildStorageKey("video", jobId, `${jobId}.mp4`);
    const { readFile } = await import("node:fs/promises");
    const finalBuffer = await readFile(finalPath);
    await storage.put(outputKey, finalBuffer, "video/mp4");

    await updateJob(jobId, {
      status: "completed",
      progress: 100,
      outputKey,
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown render error";
    await updateJob(jobId, { status: "failed", error: message });
    throw err;
  } finally {
    rmSync(rawPath, { force: true });
    rmSync(finalPath, { force: true });
  }
}

export async function renderLocal(options: {
  compositionId: Template["compositionId"];
  lyrics: LyricLine[];
  audioPath: string;
  outputPath: string;
  style?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: number;
  };
}): Promise<void> {
  const serveUrl = await getBundleLocation();
  const durationMs = getDurationFromLyrics(options.lyrics);
  const durationInFrames = Math.ceil((durationMs / 1000) * FPS);

  const inputProps = lyricTemplatePropsSchema.parse({
    lyrics: options.lyrics,
    audioUrl: options.audioPath,
    style: {
      primaryColor: options.style?.primaryColor ?? "#ffffff",
      secondaryColor: options.style?.secondaryColor ?? "#ffcc00",
      fontFamily: options.style?.fontFamily ?? "Inter, sans-serif",
      fontSize: options.style?.fontSize ?? 56,
    },
  });

  const composition = await selectComposition({
    serveUrl,
    id: options.compositionId,
    inputProps,
  });

  composition.durationInFrames = durationInFrames;

  const rawPath = options.outputPath.replace(/\.mp4$/, "-raw.mp4");

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: rawPath,
    inputProps,
  });

  await postProcessRender({
    rawVideoPath: rawPath,
    audioPath: options.audioPath,
    outputPath: options.outputPath,
    durationMs,
  });

  rmSync(rawPath, { force: true });
}
