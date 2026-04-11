import { z } from "zod";

export const textStyleSchema = z.object({
  color: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
});

export const lyricLineSchema = z.object({
  text: z.string().min(1),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  style: textStyleSchema.partial().optional(),
}).refine((line) => line.endMs > line.startMs, {
  message: "endMs must be greater than startMs",
});

export const templateParamsSchema = z.object({
  primaryColor: z.string().default("#ffffff"),
  secondaryColor: z.string().default("#ffcc00"),
  fontFamily: z.string().default("Inter, sans-serif"),
  fontSize: z.number().positive().default(48),
  backgroundAssetId: z.string().uuid().optional(),
});

export const assetTypeSchema = z.enum(["audio", "font", "image", "video"]);

export const assetSchema = z.object({
  id: z.string().uuid(),
  type: assetTypeSchema,
  filename: z.string(),
  mimeType: z.string(),
  storageKey: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
});

export const createAssetSchema = z.object({
  type: assetTypeSchema,
});

export const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  compositionId: z.string().min(1),
  description: z.string().optional(),
  defaultParams: templateParamsSchema,
  previewUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  compositionId: z.string().min(1),
  description: z.string().optional(),
  defaultParams: templateParamsSchema.partial().optional(),
  previewUrl: z.string().url().optional(),
});

export const renderStatusSchema = z.enum([
  "queued",
  "rendering",
  "post_processing",
  "completed",
  "failed",
]);

export const renderJobSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  lyrics: z.array(lyricLineSchema).min(1),
  audioAssetId: z.string().uuid(),
  params: templateParamsSchema,
  status: renderStatusSchema,
  progress: z.number().min(0).max(100),
  outputKey: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const renderRequestSchema = z.object({
  templateId: z.string().uuid(),
  lyrics: z.array(lyricLineSchema).min(1),
  audioAssetId: z.string().uuid(),
  overrides: templateParamsSchema.partial().optional(),
});

export const lyricTemplatePropsSchema = z.object({
  lyrics: z.array(lyricLineSchema),
  audioUrl: z.string(),
  backgroundAssetUrl: z.string().optional(),
  style: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    fontFamily: z.string(),
    fontSize: z.number(),
  }),
});

export type TextStyle = z.infer<typeof textStyleSchema>;
export type LyricLine = z.infer<typeof lyricLineSchema>;
export type TemplateParams = z.infer<typeof templateParamsSchema>;
export type AssetType = z.infer<typeof assetTypeSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Template = z.infer<typeof templateSchema>;
export type RenderStatus = z.infer<typeof renderStatusSchema>;
export type RenderJob = z.infer<typeof renderJobSchema>;
export type RenderRequest = z.infer<typeof renderRequestSchema>;
export type LyricTemplateProps = z.infer<typeof lyricTemplatePropsSchema>;

export const ASSET_SIZE_LIMITS: Record<AssetType, number> = {
  audio: 50 * 1024 * 1024,
  font: 5 * 1024 * 1024,
  image: 20 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

export const RENDER_FPS = 30;
export const RENDER_WIDTH = 1920;
export const RENDER_HEIGHT = 1080;

export function getDurationMs(lyrics: LyricLine[], paddingMs = 2000): number {
  if (lyrics.length === 0) return 5000;
  const lastEnd = Math.max(...lyrics.map((l) => l.endMs));
  return lastEnd + paddingMs;
}

export const FPS = RENDER_FPS;
export const WIDTH = RENDER_WIDTH;
export const HEIGHT = RENDER_HEIGHT;

export function msToFrames(ms: number, fps = RENDER_FPS): number {
  return Math.round((ms / 1000) * fps);
}

export const ASSET_MIME_TYPES: Record<AssetType, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "application/octet-stream"],
  font: ["font/ttf", "font/otf", "font/woff", "font/woff2", "application/font-woff", "application/font-woff2", "application/octet-stream"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};
