import { invoke } from "@tauri-apps/api/core";

interface PresentationSlide {
  index: number;
  image: string;
}

interface PresentationBenchmark {
  open: number;
  total: number;
}

export interface PresentationPreviewResult {
  fileName: string;
  extension: string;
  totalSlides: number;
  slides: PresentationSlide[];
  benchmark?: PresentationBenchmark;
}

interface CacheEntry {
  promise: Promise<PresentationPreviewResult>;
  createdAt: number;
}

const presentationPromiseCache =
  new Map<string, CacheEntry>();

const PRESENTATION_CACHE_TTL =
  10 * 60 * 1000;

function createKey(
  filePath: string,
  slideIndex: number,
): string {
  return `${filePath}::slide:${slideIndex}`;
}

function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (
    const [key, entry]
    of presentationPromiseCache
  ) {
    if (
      now - entry.createdAt >
      PRESENTATION_CACHE_TTL
    ) {
      presentationPromiseCache.delete(key);
    }
  }
}

export function renderPresentation(
  filePath: string,
  slideIndex = 0,
): Promise<PresentationPreviewResult> {
  cleanupExpiredEntries();

  const key = createKey(
    filePath,
    slideIndex,
  );

  const existing =
    presentationPromiseCache.get(key);

  if (existing) {
    return existing.promise;
  }

  const promise =
    invoke<PresentationPreviewResult>(
      "render_presentation",
      {
        filePath,
        slideIndex,
      },
    ).catch((error) => {
      presentationPromiseCache.delete(key);
      throw error;
    });

  presentationPromiseCache.set(key, {
    promise,
    createdAt: Date.now(),
  });

  return promise;
}

export function preloadPresentation(
  filePath: string,
  slideIndex = 0,
): void {
  void renderPresentation(
    filePath,
    slideIndex,
  ).catch((error) => {
    console.debug(
      "[Archio] Presentation preload gagal:",
      error,
    );
  });
}

export function clearPresentationCache(): void {
  presentationPromiseCache.clear();
}