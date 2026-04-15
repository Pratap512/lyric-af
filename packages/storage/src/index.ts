import type { AssetType } from "@lyric-af/schemas";

export interface StorageAdapter {
  put(key: string, data: Buffer | NodeJS.ReadableStream, contentType: string): Promise<void>;
  getPath(key: string): string;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export function buildStorageKey(type: AssetType, id: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${type}/${id}/${safeName}`;
}

export { LocalStorageAdapter } from "./local.js";
export { S3StorageAdapter } from "./s3.js";
