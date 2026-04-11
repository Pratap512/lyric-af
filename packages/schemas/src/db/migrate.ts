import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDatabase } from "./index.js";

const databaseUrl = process.env.DATABASE_URL ?? "./data/lyric-af.db";

mkdirSync(dirname(databaseUrl), { recursive: true });

const db = createDatabase(databaseUrl);

await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });

console.log(`Migrations applied to ${databaseUrl}`);
