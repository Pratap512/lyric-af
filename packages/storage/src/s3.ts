import type { StorageAdapter } from "./index.js";

/**
 * S3-compatible adapter stub for future production deploy.
 * Throws until AWS credentials and bucket are configured.
 */
export class S3StorageAdapter implements StorageAdapter {
  constructor(_bucket: string, _region: string) {}

  async put(_key: string, _data: Buffer | NodeJS.ReadableStream, _contentType: string): Promise<void> {
    throw new Error("S3StorageAdapter is not implemented yet. Use LocalStorageAdapter for development.");
  }

  getPath(_key: string): string {
    throw new Error("S3StorageAdapter does not support local paths.");
  }

  getUrl(_key: string): string {
    throw new Error("S3StorageAdapter is not implemented yet.");
  }

  async delete(_key: string): Promise<void> {
    throw new Error("S3StorageAdapter is not implemented yet.");
  }

  async exists(_key: string): Promise<boolean> {
    throw new Error("S3StorageAdapter is not implemented yet.");
  }
}
