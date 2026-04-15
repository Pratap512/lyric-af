import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import type { StorageAdapter } from "./index.js";

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly basePath: string,
    private readonly publicBaseUrl: string,
  ) {
    mkdirSync(basePath, { recursive: true });
  }

  async put(key: string, data: Buffer | NodeJS.ReadableStream, _contentType: string): Promise<void> {
    const fullPath = this.getPath(key);
    mkdirSync(dirname(fullPath), { recursive: true });

    if (Buffer.isBuffer(data)) {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(fullPath, data);
      return;
    }

    await pipeline(data, createWriteStream(fullPath));
  }

  getPath(key: string): string {
    return join(this.basePath, key);
  }

  getUrl(key: string): string {
    return `${this.publicBaseUrl}/files/${encodeURI(key)}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getPath(key);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { force: true });
    }
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.getPath(key));
  }

  createReadStream(key: string) {
    return createReadStream(this.getPath(key));
  }
}
