import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["audio", "font", "image", "video"] }).notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  storageKey: text("storage_key").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  createdAt: text("created_at").notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  compositionId: text("composition_id").notNull(),
  description: text("description"),
  defaultParams: text("default_params", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  previewUrl: text("preview_url"),
  createdAt: text("created_at").notNull(),
});

export const renderJobs = sqliteTable("render_jobs", {
  id: text("id").primaryKey(),
  templateId: text("template_id").notNull().references(() => templates.id),
  lyrics: text("lyrics", { mode: "json" }).$type<unknown[]>().notNull(),
  audioAssetId: text("audio_asset_id").notNull().references(() => assets.id),
  params: text("params", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  status: text("status", {
    enum: ["queued", "rendering", "post_processing", "completed", "failed"],
  }).notNull(),
  progress: integer("progress").notNull().default(0),
  outputKey: text("output_key"),
  error: text("error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
