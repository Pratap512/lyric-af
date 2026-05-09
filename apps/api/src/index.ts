import Fastify from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { Queue } from "bullmq";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDatabase } from "@lyric-af/schemas/db";
import { seedDefaultTemplates } from "@lyric-af/schemas/db/seed";
import { env } from "./config.js";
import { RENDER_QUEUE_NAME } from "./queue.js";
import {
  createAssetFromUpload,
  createAssetSchema,
  createRenderJob,
  createTemplate,
  deleteAsset,
  getAsset,
  getAssetUrl,
  getOutputUrl,
  getRenderJob,
  getTemplate,
  listTemplates,
} from "./services.js";

async function bootstrap() {
  mkdirSync(dirname(env.databaseUrl), { recursive: true });
  mkdirSync(env.storagePath, { recursive: true });

  const db = createDatabase(env.databaseUrl);
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../../packages/schemas/drizzle", import.meta.url)) });
  await seedDefaultTemplates(env.databaseUrl);

  const connection = { url: env.redisUrl, maxRetriesPerRequest: null };
  const renderQueue = new Queue(RENDER_QUEUE_NAME, { connection });

  const app = Fastify({ logger: true });

  await app.register(multipart, {
    limits: { fileSize: 200 * 1024 * 1024 },
  });

  await app.register(fastifyStatic, {
    root: env.storagePath,
    prefix: "/files/",
    decorateReply: false,
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/assets", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: "No file uploaded" });
    }

    const fields = data.fields as Record<string, { value?: string } | undefined>;
    const typeField = fields.type?.value;
    const parsedType = createAssetSchema.safeParse({ type: typeField });
    if (!parsedType.success) {
      return reply.code(400).send({ error: "Invalid or missing asset type" });
    }

    try {
      const buffer = await data.toBuffer();
      const asset = await createAssetFromUpload(
        parsedType.data.type,
        data.filename,
        data.mimetype,
        buffer,
        buffer.length,
      );
      return reply.code(201).send({ ...asset, url: getAssetUrl(asset) });
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      return reply.code(error.statusCode ?? 500).send({ error: error.message });
    }
  });

  app.get("/assets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const asset = await getAsset(id);
    if (!asset) return reply.code(404).send({ error: "Asset not found" });
    return { ...asset, url: getAssetUrl(asset) };
  });

  app.delete("/assets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await deleteAsset(id);
    if (!deleted) return reply.code(404).send({ error: "Asset not found" });
    return reply.code(204).send();
  });

  app.post("/templates", async (request, reply) => {
    try {
      const template = await createTemplate(request.body);
      return reply.code(201).send(template);
    } catch (err) {
      const error = err as Error;
      return reply.code(400).send({ error: error.message });
    }
  });

  app.get("/templates", async () => listTemplates());

  app.get("/templates/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const template = await getTemplate(id);
    if (!template) return reply.code(404).send({ error: "Template not found" });
    return template;
  });

  app.post("/renders", async (request, reply) => {
    try {
      const job = await createRenderJob(request.body);
      await renderQueue.add("render", { jobId: job.id }, { jobId: job.id });
      return reply.code(202).send({ jobId: job.id, status: job.status });
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      return reply.code(error.statusCode ?? 400).send({ error: error.message });
    }
  });

  app.get("/renders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await getRenderJob(id);
    if (!job) return reply.code(404).send({ error: "Render job not found" });
    return {
      ...job,
      outputUrl: getOutputUrl(job),
    };
  });

  await app.listen({ port: env.apiPort, host: "0.0.0.0" });
  console.log(`API listening on ${env.apiPublicUrl}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
