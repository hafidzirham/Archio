import { convertFileSrc } from "@tauri-apps/api/core";

import ImagePreview from "./image/ImagePreview";
import VectorPreview from "./image/VectorPreview";
import VideoPreview from "./video/VideoPreview";
import AudioPreview from "./audio/AudioPreview";
import DocumentPreview from "./document/DocumentPreview";
import PresentationPreview from "./presentation/PresentationPreview";
import UnsupportedPreview from "./unsupported/UnsupportedPreview";
import PreviewErrorBoundary from "./PreviewErrorBoundary";

import type { FileMetadata } from "../../types/file";


interface PreviewResolverProps {
  file: FileMetadata;
}


function PreviewContent({
  file,
}: PreviewResolverProps) {

  const extension =
    file.extension.toLowerCase();


  const previewSrc =
    convertFileSrc(
      file.path
    );


  /*
   * =========================================================
   * VECTOR / IMAGE
   * =========================================================
   *
   * SVG:
   *   Ditampilkan langsung oleh browser.
   *
   * AI / EPS / PS / PSD / PSB:
   *   Dirender menggunakan backend ImageMagick.
   */

  if (
    file.category === "image"
  ) {

    const isVectorRendererFormat =
      extension === ".ai" ||
      extension === ".eps" ||
      extension === ".ps" ||
      extension === ".psd" ||
      extension === ".psb";


    if (
      isVectorRendererFormat
    ) {

      return (
        <VectorPreview
          filePath={
            file.path
          }

          fileName={
            file.name
          }

          extension={
            file.extension
          }
        />
      );
    }


    /*
     * SVG dan image biasa tetap
     * ditampilkan secara native.
     */

    return (
      <ImagePreview
        src={
          previewSrc
        }

        fileName={
          file.name
        }
      />
    );
  }


  /*
   * =========================================================
   * VIDEO
   * =========================================================
   */

  if (
    file.category === "video"
  ) {

    return (
      <VideoPreview
        src={
          previewSrc
        }

        fileName={
          file.name
        }
      />
    );
  }


  /*
   * =========================================================
   * AUDIO
   * =========================================================
   */

  if (
    file.category === "audio"
  ) {

    return (
      <AudioPreview
        src={
          previewSrc
        }

        fileName={
          file.name
        }
      />
    );
  }


  /*
   * =========================================================
   * DOCUMENT
   * =========================================================
   *
   * PDF:
   *   Preview langsung.
   *
   * DOC / DOCX / ODT / TXT:
   *   Tetap menggunakan UnsupportedPreview
   *   sampai renderer document masing-masing dipasang.
   */

  if (
    file.category === "document"
  ) {

    if (
      extension === ".pdf"
    ) {

      return (
        <DocumentPreview
          src={
            previewSrc
          }

          fileName={
            file.name
          }
        />
      );
    }


    return (
      <UnsupportedPreview
        fileName={
          file.name
        }

        filePath={
          file.path
        }

        extension={
          file.extension
        }
      />
    );
  }


  /*
   * =========================================================
   * PRESENTATION
   * =========================================================
   */

  if (
    file.category ===
    "presentation"
  ) {

    return (
      <PresentationPreview
        src={
          file.path
        }

        fileName={
          file.name
        }
      />
    );
  }


  /*
   * =========================================================
   * SPREADSHEET
   * =========================================================
   */

  if (
    file.category ===
    "spreadsheet"
  ) {

    return (
      <UnsupportedPreview
        fileName={
          file.name
        }

        filePath={
          file.path
        }

        extension={
          file.extension
        }
      />
    );
  }


  /*
   * =========================================================
   * UNSUPPORTED
   * =========================================================
   */

  return (
    <UnsupportedPreview
      fileName={
        file.name
      }

      filePath={
        file.path
      }

      extension={
        file.extension
      }
    />
  );
}


/*
 * ===========================================================
 * ERROR BOUNDARY
 * ===========================================================
 *
 * Kalau preview suatu file error, sorting page tidak ikut
 * blank/crash. Error ditangani oleh PreviewErrorBoundary.
 */

function PreviewResolver({
  file,
}: PreviewResolverProps) {

  return (
    <PreviewErrorBoundary
      key={
        `${file.path}-${file.extension}`
      }

      fileName={
        file.name
      }

      extension={
        file.extension
      }
    >

      <PreviewContent
        file={
          file
        }
      />

    </PreviewErrorBoundary>
  );
}


export default PreviewResolver;