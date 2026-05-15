import { Worker } from "bullmq";
import { checkFfmpegAvailable } from "@lyric-af/ffmpeg";
import { env } from "./config.js";
import { processRenderJob } from "./render.js";

const RENDER_QUEUE_NAME = "render-jobs";

async function start() {
  await checkFfmpegAvailable();
  console.log("FFmpeg available");

  const connection = { url: env.redisUrl, maxRetriesPerRequest: null };

  const worker = new Worker<{ jobId: string }>(
    RENDER_QUEUE_NAME,
    async (job) => {
      const { jobId } = job.data;
      console.log(`Processing render job ${jobId}`);
      await processRenderJob(jobId);
      console.log(`Completed render job ${jobId}`);
    },
    { connection, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  console.log("Worker listening for render jobs");
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
