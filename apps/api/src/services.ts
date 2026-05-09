import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  ASSET_MIME_TYPES,
  ASSET_SIZE_LIMITS,
  assetSchema,
  createAssetSchema,
  createTemplateSchema,
  renderJobSchema,
  renderRequestSchema,
  templateParamsSchema,
  templateSchema,
  type Asset,
  type RenderJob,
  type Template,
} from "@lyric-af/schemas";
import { createDatabase, schema } from "@lyric-af/schemas/db";
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
mkdirSync(env.storagePath, { recursive: true });

function toAsset(row: typeof schema.assets.$inferSelect): Asset {
  return assetSchema.parse({
    id: row.id,
    type: row.type,
    filename: row.filename,
    mimeType: row.mimeType,
    storageKey: row.storageKey,
    sizeBytes: row.sizeBytes,
    metadata: row.metadata,
    createdAt: row.createdAt,
  });
}

function toTemplate(row: typeof schema.templates.$inferSelect): Template {
  return templateSchema.parse({
    id: row.id,
    name: row.name,
    compositionId: row.compositionId,
    description: row.description ?? undefined,
    defaultParams: templateParamsSchema.parse(row.defaultParams),
    previewUrl: row.previewUrl ?? undefined,
    createdAt: row.createdAt,
  });
}

function toRenderJob(row: typeof schema.renderJobs.$inferSelect): RenderJob {
  return renderJobSchema.parse({
    id: row.id,
    templateId: row.templateId,
    lyrics: row.lyrics,
    audioAssetId: row.audioAssetId,
    params: templateParamsSchema.parse(row.params),
    status: row.status,
    progress: row.progress,
    outputKey: row.outputKey ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export async function createAssetFromUpload(
  type: Asset["type"],
  filename: string,
  mimeType: string,
  stream: Buffer | NodeJS.ReadableStream,
  sizeBytes: number,
): Promise<Asset> {
  const allowed = ASSET_MIME_TYPES[type];
  if (!allowed.includes(mimeType)) {
    throw Object.assign(new Error(`MIME type ${mimeType} not allowed for ${type}`), { statusCode: 400 });
  }

  const limit = ASSET_SIZE_LIMITS[type];
  if (sizeBytes > limit) {
    throw Object.assign(new Error(`File exceeds ${limit} byte limit for ${type}`), { statusCode: 400 });
  }

  const id = randomUUID();
  const storageKey = buildStorageKey(type, id, filename);
  await storage.put(storageKey, stream, mimeType);

  const now = new Date().toISOString();
  const [row] = await db().insert(schema.assets).values({
    id,
    type,
    filename,
    mimeType,
    storageKey,
    sizeBytes,
    metadata: {},
    createdAt: now,
  }).returning();

  return toAsset(row);
}

export async function getAsset(id: string): Promise<Asset | null> {
  const row = await db().query.assets.findFirst({ where: eq(schema.assets.id, id) });
  return row ? toAsset(row) : null;
}

export async function deleteAsset(id: string): Promise<boolean> {
  const row = await db().query.assets.findFirst({ where: eq(schema.assets.id, id) });
  if (!row) return false;
  await storage.delete(row.storageKey);
  await db().delete(schema.assets).where(eq(schema.assets.id, id));
  return true;
}

export function getAssetUrl(asset: Asset): string {
  return storage.getUrl(asset.storageKey);
}

export async function createTemplate(input: unknown): Promise<Template> {
  const parsed = createTemplateSchema.parse(input);
  const id = randomUUID();
  const now = new Date().toISOString();
  const defaultParams = templateParamsSchema.parse(parsed.defaultParams ?? {});

  const [row] = await db().insert(schema.templates).values({
    id,
    name: parsed.name,
    compositionId: parsed.compositionId,
    description: parsed.description,
    defaultParams,
    previewUrl: parsed.previewUrl,
    createdAt: now,
  }).returning();

  return toTemplate(row);
}

export async function listTemplates(): Promise<Template[]> {
  const rows = await db().query.templates.findMany();
  return rows.map(toTemplate);
}

export async function getTemplate(id: string): Promise<Template | null> {
  const row = await db().query.templates.findFirst({ where: eq(schema.templates.id, id) });
  return row ? toTemplate(row) : null;
}

export async function createRenderJob(input: unknown): Promise<RenderJob> {
  const parsed = renderRequestSchema.parse(input);
  const template = await getTemplate(parsed.templateId);
  if (!template) {
    throw Object.assign(new Error("Template not found"), { statusCode: 404 });
  }

  const audio = await getAsset(parsed.audioAssetId);
  if (!audio || audio.type !== "audio") {
    throw Object.assign(new Error("Audio asset not found"), { statusCode: 404 });
  }

  if (parsed.overrides?.backgroundAssetId) {
    const bg = await getAsset(parsed.overrides.backgroundAssetId);
    if (!bg || (bg.type !== "image" && bg.type !== "video")) {
      throw Object.assign(new Error("Background asset not found"), { statusCode: 404 });
    }
  }

  const params = templateParamsSchema.parse({
    ...template.defaultParams,
    ...parsed.overrides,
  });

  const id = randomUUID();
  const now = new Date().toISOString();

  const [row] = await db().insert(schema.renderJobs).values({
    id,
    templateId: parsed.templateId,
    lyrics: parsed.lyrics,
    audioAssetId: parsed.audioAssetId,
    params,
    status: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return toRenderJob(row);
}

export async function getRenderJob(id: string): Promise<RenderJob | null> {
  const row = await db().query.renderJobs.findFirst({ where: eq(schema.renderJobs.id, id) });
  return row ? toRenderJob(row) : null;
}

export function getOutputUrl(job: RenderJob): string | undefined {
  if (!job.outputKey) return undefined;
  return storage.getUrl(job.outputKey);
}

export { storage, createAssetSchema };
