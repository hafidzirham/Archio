interface PresentationControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function PresentationControls({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
}: PresentationControlsProps) {
  const progress =
    totalSlides <= 1
      ? 100
      : ((currentSlide + 1) / totalSlides) * 100;

  return (
    <div className="presentation-controls">
      <button
        type="button"
        className="presentation-nav-button"
        onClick={onPrevious}
        disabled={currentSlide === 0}
        aria-label="Previous slide"
      >
        <span className="presentation-arrow left" />
      </button>

      <div className="presentation-progress-area">
        <span className="presentation-slide-counter">
          Slide {currentSlide + 1} dari {totalSlides}
        </span>

        <div className="presentation-progress">
          <div
            className="presentation-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <button
        type="button"
        className="presentation-nav-button"
        onClick={onNext}
        disabled={currentSlide === totalSlides - 1}
        aria-label="Next slide"
      >
        <span className="presentation-arrow right" />
      </button>
    </div>
  );
}