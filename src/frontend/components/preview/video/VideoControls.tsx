import { useState } from "react";

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;

  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
}

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5];

function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
}: VideoControlsProps) {
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);

  /*
   * =========================================================
   * FORMAT TIME
   * =========================================================
   */

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "00:00";
    }

    const totalSeconds = Math.floor(seconds);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const secs = totalSeconds % 60;

    if (hours > 0) {
      return [
        hours,
        minutes.toString().padStart(2, "0"),
        secs.toString().padStart(2, "0"),
      ].join(":");
    }

    return [
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  /*
   * =========================================================
   * PROGRESS
   * =========================================================
   */

  const progress =
    duration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (currentTime / duration) * 100
          )
        )
      : 0;

  /*
   * =========================================================
   * VOLUME ICON
   * =========================================================
   */

  const volumeIcon = () => {
    if (volume === 0) {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M11 5 6 9H3v6h3l5 4V5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="m17 9-4 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          <path
            d="m13 9 4 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    if (volume < 0.5) {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M11 5 6 9H3v6h3l5 4V5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M15 10a3 3 0 0 1 0 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M11 5 6 9H3v6h3l5 4V5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M15 9a5 5 0 0 1 0 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M18 6a9 9 0 0 1 0 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="video-controls">
      <div className="video-controls-main">

        {/* =================================================
            ENTIRE CONTROL GROUP
            ================================================= */}

        <div className="video-controls-group">

          {/* =================================================
              PLAY / PAUSE
              ================================================= */}

          <button
            type="button"
            className="video-control-button video-play-button"
            onClick={onPlayPause}
            aria-label={
              isPlaying ? "Pause" : "Play"
            }
          >
            {isPlaying ? (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="6"
                  y="5"
                  width="4"
                  height="14"
                  rx="1"
                  fill="currentColor"
                />

                <rect
                  x="14"
                  y="5"
                  width="4"
                  height="14"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M8 5.5v13l10-6.5L8 5.5Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* =================================================
              CURRENT TIME
              ================================================= */}

          <span className="video-time video-current-time">
            {formatTime(currentTime)}
          </span>

          {/* =================================================
              SEEK BAR
              ================================================= */}

          <div className="video-seek-wrapper">
            <input
              className="video-seek"
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={currentTime}
              onChange={(event) => {
                onSeek(
                  Number(event.target.value)
                );
              }}
              style={
                {
                  "--progress": `${progress}%`,
                } as React.CSSProperties
              }
              aria-label="Video progress"
            />
          </div>

          {/* =================================================
              DURATION
              ================================================= */}

          <span className="video-time video-duration">
            {formatTime(duration)}
          </span>

          {/* =================================================
              DIVIDER
              ================================================= */}

          <div className="video-control-divider" />

          {/* =================================================
              VOLUME
              ================================================= */}

          <div className="video-volume">

            <button
              type="button"
              className="video-icon-button"
              onClick={() => {
                if (volume > 0) {
                  onVolumeChange(0);
                } else {
                  onVolumeChange(1);
                }
              }}
              aria-label={
                volume > 0
                  ? "Mute"
                  : "Unmute"
              }
            >
              {volumeIcon()}
            </button>

            <input
              className="video-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => {
                onVolumeChange(
                  Number(event.target.value)
                );
              }}
              style={
                {
                  "--volume": `${volume * 100}%`,
                } as React.CSSProperties
              }
              aria-label="Volume"
            />

          </div>

          {/* =================================================
              DIVIDER
              ================================================= */}

          <div className="video-control-divider" />

          {/* =================================================
              PLAYBACK SPEED
              ================================================= */}

          <div className="video-speed">

            <button
              type="button"
              className="video-speed-button"
              onClick={() => {
                setIsSpeedOpen(
                  (previous) => !previous
                );
              }}
              aria-haspopup="menu"
              aria-expanded={isSpeedOpen}
            >
              <span>
                {playbackRate}x
              </span>

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="m7 10 5 5 5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isSpeedOpen && (
              <div
                className="video-speed-menu"
                role="menu"
              >
                {PLAYBACK_RATES.map(
                  (rate) => (
                    <button
                      type="button"
                      key={rate}
                      className={
                        rate === playbackRate
                          ? "video-speed-option active"
                          : "video-speed-option"
                      }
                      onClick={() => {
                        onPlaybackRateChange(
                          rate
                        );

                        setIsSpeedOpen(false);
                      }}
                      role="menuitem"
                    >
                      {rate}x
                    </button>
                  )
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default VideoControls;