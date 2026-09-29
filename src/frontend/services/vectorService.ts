import { invoke } from "@tauri-apps/api/core";

interface VectorCacheEntry {
  promise: Promise<string>;
  createdAt: number;
}

const vectorPromiseCache =
  new Map<string, VectorCacheEntry>();

const VECTOR_CACHE_TTL =
  10 * 60 * 1000;

function createKey(
  filePath: string,
): string {
  return filePath;
}

function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [key, entry] of vectorPromiseCache) {
    if (
      now - entry.createdAt >
      VECTOR_CACHE_TTL
    ) {
      vectorPromiseCache.delete(key);
    }
  }
}

export function renderVectorPreview(
  filePath: string,
): Promise<string> {
  cleanupExpiredEntries();

  const key = createKey(filePath);

  const existing =
    vectorPromiseCache.get(key);

  if (existing) {
    return existing.promise;
  }

  const promise =
    invoke<string>(
      "render_image_preview",
      {
        filePath,
      },
    ).catch((error) => {
      vectorPromiseCache.delete(key);
      throw error;
    });

  vectorPromiseCache.set(key, {
    promise,
    createdAt: Date.now(),
  });

  return promise;
}

export function preloadVectorPreview(
  filePath: string,
): void {
  void renderVectorPreview(
    filePath,
  ).catch((error) => {
    console.debug(
      "[Archio] Vector preload gagal:",
      error,
    );
  });
}

export function clearVectorCache(): void {
  vectorPromiseCache.clear();
}