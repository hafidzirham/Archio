interface SortingProgressProps {
  current: number;
  total: number;
  remaining: number;
}

function SortingProgress({
  current,
  total,
  remaining,
}: SortingProgressProps) {
  const safeTotal =
    Math.max(total, 0);

  const safeCurrent =
    Math.min(
      Math.max(current, 0),
      safeTotal
    );

  const progress =
    safeTotal > 0
      ? (safeCurrent / safeTotal) * 100
      : 0;

  return (
    <div className="sorting-progress">
      <div className="sorting-progress-header">
        <span className="sorting-progress-current">
          File {safeCurrent} dari{" "}
          {safeTotal}
        </span>

        <span className="sorting-progress-remaining">
          {remaining} Tersisa
        </span>
      </div>

      <div
        className="sorting-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeCurrent}
        aria-label="Progress sorting"
      >
        <div
          className="sorting-progress-fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

export default SortingProgress;