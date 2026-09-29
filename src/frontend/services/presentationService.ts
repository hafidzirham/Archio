import { invoke } from "@tauri-apps/api/core";

import type {
  PresentationPreviewResult,
} from "../types/presentation";


export async function renderPresentation(
  filePath: string,
  slideIndex = 0
): Promise<PresentationPreviewResult> {

  return await invoke<PresentationPreviewResult>(
    "render_presentation",
    {
      filePath,
      slideIndex,
    }
  );
}