import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import "../../../styles/unsupported.css";

interface UnsupportedPreviewProps {
  fileName?: string;
  filePath?: string;
  extension?: string;
}

function UnsupportedPreview({
  filePath,
}: UnsupportedPreviewProps) {
  const [isOpening, setIsOpening] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const handleOpenWith = async () => {
    if (!filePath || isOpening) {
      return;
    }

    try {
      setError(null);
      setIsOpening(true);

      await invoke<void>(
        "open_file_with",
        {
          filePath,
        },
      );
    } catch (error) {
      console.error(
        "[Archio] Open With gagal:",
        error,
      );

      setError(
        typeof error === "string"
          ? error
          : "Tidak dapat membuka dialog aplikasi.",
      );
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="unsupported-preview">
      <div className="unsupported-preview-card">
        <div className="unsupported-preview-icon">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M18 6H38L50 18V54C50 56.2091 48.2099 58 46 58H18C15.7909 58 14 56.2099 14 54V10C14 7.79086 15.7909 6 18 6Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            <path
              d="M38 6V18H50"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            <path
              d="M24 30H40"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M24 38H40"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M24 46H34"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="unsupported-preview-content">
          <h3>
            Preview tidak tersedia
          </h3>

          <p>
            Archio belum mendukung
            preview untuk file ini.
          </p>

          <button
            type="button"
            className="unsupported-open-button"
            onClick={handleOpenWith}
            disabled={
              !filePath ||
              isOpening
            }
          >
            <span className="unsupported-open-button-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M14 5H19V10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M19 5L11 13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M19 14V18C19 19.1046 18.1046 20 17 20H6C4.89543 20 4 19.1046 4 18V7C4 5.89543 4.89543 5 6 5H10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <span>
              {isOpening
                ? "Membuka..."
                : "Buka dengan aplikasi"}
            </span>
          </button>

          {error && (
            <span className="unsupported-open-error">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnsupportedPreview;