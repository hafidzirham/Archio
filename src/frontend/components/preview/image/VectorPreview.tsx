import { useEffect, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

import ImagePreview from "./ImagePreview";

interface VectorPreviewProps {
  filePath: string;
  fileName: string;
  extension: string;
}

function VectorPreview({
  filePath,
  fileName,
  extension,
}: VectorPreviewProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        setPreviewSrc(null);
        setError(null);

        const renderedPath = await invoke<string>(
          "render_image_preview",
          {
            filePath,
          },
        );

        if (cancelled) {
          return;
        }

        setPreviewSrc(
          convertFileSrc(renderedPath),
        );
      } catch (renderError) {
        console.error(
          "[Archio] Vector preview error:",
          renderError,
        );

        if (cancelled) {
          return;
        }

        setError(
          renderError instanceof Error
            ? renderError.message
            : String(renderError),
        );
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  if (error) {
    return (
      <div className="vector-preview-error">
        <div className="vector-preview-error-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 9V13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 17H12.01"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M10.3 4.7L3.4 17C2.7 18.3 3.7 20 5.2 20H18.8C20.3 20 21.3 18.3 20.6 17L13.7 4.7C13 3.4 11 3.4 10.3 4.7Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="vector-preview-error-title">
          Preview tidak tersedia
        </div>

        <div className="vector-preview-error-text">
          File {extension.toUpperCase()} tidak dapat dirender.
        </div>

        <div className="vector-preview-error-detail">
          {error}
        </div>
      </div>
    );
  }

  if (!previewSrc) {
    return (
      <div className="vector-preview-loading">
        <div className="vector-preview-spinner" />
        <span>Menyiapkan preview...</span>
      </div>
    );
  }

  return (
    <ImagePreview
      src={previewSrc}
      fileName={fileName}
    />
  );
}

export default VectorPreview;