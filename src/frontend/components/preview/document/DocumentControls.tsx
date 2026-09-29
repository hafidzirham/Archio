interface DocumentControlsProps {
  currentPage: number;
  numPages: number;
  scale: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

function DocumentControls({
  currentPage,
  numPages,
  scale,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onFit,
}: DocumentControlsProps) {
  const zoomPercentage = Math.round(scale * 100);

  const whiteTextStyle: React.CSSProperties = {
    color: "#ffffff",
  };

  return (
    <div className="document-controls">

      {/* Previous Page */}
      <button
        type="button"
        className="document-control-button"
        onClick={onPreviousPage}
        disabled={currentPage <= 1}
        aria-label="Halaman sebelumnya"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m14 6-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>


      {/* Page Counter */}
      <span
        className="document-page-counter"
        style={whiteTextStyle}
      >
        {currentPage}/{numPages}
      </span>


      {/* Next Page */}
      <button
        type="button"
        className="document-control-button"
        onClick={onNextPage}
        disabled={currentPage >= numPages}
        aria-label="Halaman berikutnya"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m10 6 6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>


      {/* Divider */}
      <span className="document-control-divider" />


      {/* Zoom Out */}
      <button
        type="button"
        className="document-control-button"
        onClick={onZoomOut}
        disabled={scale <= 0.25}
        aria-label="Zoom out"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>


      {/* Zoom Percentage */}
      <span
        className="document-zoom-value"
        style={whiteTextStyle}
      >
        {zoomPercentage}%
      </span>


      {/* Zoom In */}
      <button
        type="button"
        className="document-control-button"
        onClick={onZoomIn}
        disabled={scale >= 3}
        aria-label="Zoom in"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 5v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>


      {/* Divider */}
      <span className="document-control-divider" />


      {/* Fit */}
      <button
        type="button"
        className="document-fit-button"
        onClick={onFit}
        style={whiteTextStyle}
      >
        fit
      </button>

    </div>
  );
}

export default DocumentControls;