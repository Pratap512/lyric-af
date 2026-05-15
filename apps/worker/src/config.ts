import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), "../../.env") });

const rootDir = resolve(process.cwd(), "../..");

export const env = {
  databaseUrl: resolve(rootDir, process.env.DATABASE_URL?.replace(/^\.\//, "") ?? "data/lyric-af.db"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  storagePath: resolve(rootDir, process.env.STORAGE_PATH?.replace(/^\.\//, "") ?? "storage"),
  apiPublicUrl: process.env.API_PUBLIC_URL ?? "http://localhost:3100",
  remotionEntry: process.env.REMOTION_ENTRY
    ? resolve(rootDir, process.env.REMOTION_ENTRY.replace(/^\.\//, ""))
    : resolve(rootDir, "remotion/src/index.ts"),
  tmpDir: resolve(rootDir, process.env.TMP_DIR?.replace(/^\.\//, "") ?? "storage/tmp"),
};
