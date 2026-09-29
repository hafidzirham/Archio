import {
  useEffect,
  useRef,
  useState,
} from "react";

import "../../../styles/image.css";
import "../../../styles/preview-common.css";

import FullscreenButton from "../common/FullscreenButton";

interface ImagePreviewProps {
  src: string;
  fileName?: string;
}

function ImagePreview({
  src,
  fileName,
}: ImagePreviewProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const [zoom, setZoom] =
    useState(1);

  const [position, setPosition] =
    useState({
      x: 0,
      y: 0,
    });

  const [isDragging, setIsDragging] =
    useState(false);

  const [dragStart, setDragStart] =
    useState({
      x: 0,
      y: 0,
    });

  const [imageError, setImageError] =
    useState(false);

  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.1;

  const clampZoom = (
    value: number,
  ) => {
    return Math.min(
      MAX_ZOOM,
      Math.max(
        MIN_ZOOM,
        value,
      ),
    );
  };

  const resetView = () => {
    setZoom(1);

    setPosition({
      x: 0,
      y: 0,
    });
  };

  const handleZoomIn = () => {
    setZoom(
      (current) =>
        clampZoom(
          Number(
            (
              current +
              ZOOM_STEP
            ).toFixed(2),
          ),
        ),
    );
  };

  const handleZoomOut = () => {
    setZoom(
      (current) =>
        clampZoom(
          Number(
            (
              current -
              ZOOM_STEP
            ).toFixed(2),
          ),
        ),
    );
  };

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (zoom <= 1) {
      return;
    }

    event.preventDefault();

    setIsDragging(true);

    setDragStart({
      x:
        event.clientX -
        position.x,
      y:
        event.clientY -
        position.y,
    });
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      !isDragging ||
      zoom <= 1
    ) {
      return;
    }

    setPosition({
      x:
        event.clientX -
        dragStart.x,
      y:
        event.clientY -
        dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    setImageError(false);
    resetView();
  }, [src]);

  useEffect(() => {
    const handleKeyboard =
      (event: KeyboardEvent) => {
        if (
          event.target instanceof
            HTMLInputElement ||
          event.target instanceof
            HTMLTextAreaElement
        ) {
          return;
        }

        if (
          event.key === "+" ||
          event.key === "="
        ) {
          event.preventDefault();
          handleZoomIn();
        }

        if (event.key === "-") {
          event.preventDefault();
          handleZoomOut();
        }

        if (event.key === "0") {
          event.preventDefault();
          resetView();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyboard,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );
    };
  }, []);

  const imageTransform = `
    translate(
      ${position.x}px,
      ${position.y}px
    )
    scale(${zoom})
  `;

  return (
    <div
      ref={containerRef}
      className="image-preview"
      onMouseDown={
        handleMouseDown
      }
      onMouseMove={
        handleMouseMove
      }
      onMouseUp={
        handleMouseUp
      }
      onMouseLeave={
        handleMouseLeave
      }
    >
      {!imageError ? (
        <img
          src={src}
          alt={
            fileName ??
            "Image preview"
          }
          className="image-preview-image"
          draggable={false}
          onError={() => {
            setImageError(true);
          }}
          style={{
            transform:
              imageTransform,
            transformOrigin:
              "center center",
            userSelect: "none",
            transition:
              isDragging
                ? "none"
                : "transform 0.15s ease",
          }}
        />
      ) : (
        <div className="image-preview-error">
          <div className="image-preview-error-icon">
            <svg
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="8"
                y="8"
                width="48"
                height="48"
                rx="6"
                stroke="currentColor"
                strokeWidth="3"
              />

              <circle
                cx="22"
                cy="23"
                r="4"
                stroke="currentColor"
                strokeWidth="3"
              />

              <path
                d="M12 48L27 34L36 43L42 37L52 48"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3>
            Preview tidak tersedia
          </h3>

          <p>
            File gambar tidak dapat
            ditampilkan.
          </p>
        </div>
      )}

      <FullscreenButton
        targetRef={containerRef}
      />

      {!imageError && (
        <div
          className="image-preview-controls"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            className="image-preview-control-button"
            onClick={
              handleZoomOut
            }
            disabled={
              zoom <= MIN_ZOOM
            }
          >
            −
          </button>

          <span className="image-preview-zoom">
            {Math.round(
              zoom * 100,
            )}
            %
          </span>

          <button
            type="button"
            className="image-preview-control-button"
            onClick={
              handleZoomIn
            }
            disabled={
              zoom >= MAX_ZOOM
            }
          >
            +
          </button>

          <span className="image-preview-control-divider" />

          <button
            type="button"
            className="image-preview-fit-button"
            onClick={
              resetView
            }
          >
            fit
          </button>
        </div>
      )}
    </div>
  );
}

export default ImagePreview;