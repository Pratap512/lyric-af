import { resolve } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

export type DatabaseInstance = ReturnType<typeof createDatabase>;

export function createDatabase(databaseUrl: string) {
  const absolutePath = resolve(databaseUrl);
  const url = `file:${absolutePath}`;
  const client = createClient({ url });
  return drizzle(client, { schema });
}

export { schema };
