export const PRESENTATION_EXTENSIONS = [
  ".ppt",
  ".pptx",
  ".pptm",
  ".ppsx",
  ".ppsm",
  ".potx",
  ".potm",
  ".odp",
] as const;

export type PresentationExtension =
  (typeof PRESENTATION_EXTENSIONS)[number];

export interface PresentationSlide {
  index: number;
  image: string;
}

export interface PresentationPreviewResult {
  fileName: string;
  extension: string;
  totalSlides: number;
  slides: PresentationSlide[];
}

export function isPresentationFile(
  fileName: string
): boolean {
  const lowerName = fileName.toLowerCase();

  return PRESENTATION_EXTENSIONS.some((extension) =>
    lowerName.endsWith(extension)
  );
}