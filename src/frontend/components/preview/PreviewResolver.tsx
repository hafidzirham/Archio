import { convertFileSrc } from "@tauri-apps/api/core";

import ImagePreview from "./image/ImagePreview";
import VideoPreview from "./video/VideoPreview";
import AudioPreview from "./audio/AudioPreview";
import DocumentPreview from "./document/DocumentPreview";
import PresentationPreview from "./presentation/PresentationPreview";
import UnsupportedPreview from "./unsupported/UnsupportedPreview";
import VectorPreview from "./image/VectorPreview";
import PreviewErrorBoundary from "./PreviewErrorBoundary";

import type { FileMetadata } from "../../types/file";

interface PreviewResolverProps {
  file: FileMetadata;
}

function PreviewContent({
  file,
}: PreviewResolverProps) {
  const extension = file.extension.toLowerCase();

  /*
   * ============================================================
   * IMAGE
   * ============================================================
   */

  if (file.category === "image") {
    /*
     * SVG bisa langsung ditampilkan oleh WebView.
     */
    if (extension === ".svg") {
      return (
        <ImagePreview
          src={convertFileSrc(file.path)}
          fileName={file.name}
        />
      );
    }

    /*
     * Format desain/vector yang membutuhkan renderer.
     */
    if (
      extension === ".ai" ||
      extension === ".eps" ||
      extension === ".ps" ||
      extension === ".psd" ||
      extension === ".psb"
    ) {
      return (
        <VectorPreview
          filePath={file.path}
          fileName={file.name}
          extension={file.extension}
        />
      );
    }

    /*
     * Image raster biasa.
     */
    return (
      <ImagePreview
        src={convertFileSrc(file.path)}
        fileName={file.name}
      />
    );
  }

  /*
   * ============================================================
   * VIDEO
   * ============================================================
   */

  if (file.category === "video") {
    return (
      <VideoPreview
        src={convertFileSrc(file.path)}
        fileName={file.name}
      />
    );
  }

  /*
   * ============================================================
   * AUDIO
   * ============================================================
   */

  if (file.category === "audio") {
    return (
      <AudioPreview
        src={convertFileSrc(file.path)}
        fileName={file.name}
      />
    );
  }

  /*
   * ============================================================
   * DOCUMENT
   * ============================================================
   */

  if (file.category === "document") {
    if (extension === ".pdf") {
      return (
        <DocumentPreview
          src={convertFileSrc(file.path)}
          fileName={file.name}
        />
      );
    }

    return (
      <UnsupportedPreview
        fileName={file.name}
        filePath={file.path}
        extension={file.extension}
      />
    );
  }

  /*
   * ============================================================
   * PRESENTATION
   * ============================================================
   */

  if (file.category === "presentation") {
    return (
      <PresentationPreview
        src={file.path}
        fileName={file.name}
      />
    );
  }

  /*
   * ============================================================
   * SPREADSHEET
   * ============================================================
   */

  if (file.category === "spreadsheet") {
    return (
      <UnsupportedPreview
        fileName={file.name}
        filePath={file.path}
        extension={file.extension}
      />
    );
  }

  /*
   * ============================================================
   * FALLBACK
   * ============================================================
   */

  return (
    <UnsupportedPreview
      fileName={file.name}
      filePath={file.path}
      extension={file.extension}
    />
  );
}

function PreviewResolver({
  file,
}: PreviewResolverProps) {
  return (
    <PreviewErrorBoundary
      key={`${file.path}-${file.extension}`}
      fileName={file.name}
      extension={file.extension}
    >
      <PreviewContent file={file} />
    </PreviewErrorBoundary>
  );
}

export default PreviewResolver;