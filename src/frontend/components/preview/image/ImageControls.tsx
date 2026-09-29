interface ImageControlsProps {
  zoom: number;
  isFit: boolean;

  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

function ImageControls({
  zoom,
  isFit,
  onZoomIn,
  onZoomOut,
  onFit,
}: ImageControlsProps) {
  return (
    <div className="image-controls">

      <button
        type="button"
        className="image-control-button"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <span className="image-zoom-value">
        {zoom}%
      </span>

      <button
        type="button"
        className="image-control-button"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 5v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <span className="image-controls-divider" />

      <button
        type="button"
        className={
          isFit
            ? "image-fit-button active"
            : "image-fit-button"
        }
        onClick={onFit}
        aria-label="Fit image"
      >
        fit
      </button>

    </div>
  );
}

export default ImageControls;