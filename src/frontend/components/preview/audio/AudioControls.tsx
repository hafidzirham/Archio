import {
  useEffect,
  useRef,
  useState,
} from "react";

import type React from "react";

interface AudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (value: number) => void;
  onPlaybackRateChange: (rate: number) => void;
}

function formatTime(
  seconds: number,
): string {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const total =
    Math.floor(seconds);

  const minutes =
    Math.floor(total / 60);

  const remaining =
    total % 60;

  return `${minutes}:${String(
    remaining,
  ).padStart(2, "0")}`;
}

const PLAYBACK_RATES = [
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  2,
];

function AudioControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
}: AudioControlsProps) {
  const [isSpeedOpen, setIsSpeedOpen] =
    useState(false);

  const speedMenuRef =
    useRef<HTMLDivElement>(null);

  const safeDuration =
    Number.isFinite(duration) &&
    duration > 0
      ? duration
      : 0;

  const safeCurrentTime =
    Math.min(
      Math.max(
        currentTime,
        0,
      ),
      safeDuration,
    );

  /*
   * Tutup dropdown ketika klik
   * di luar speed menu.
   */
  useEffect(() => {
    const handleOutsideClick =
      (event: MouseEvent) => {
        if (
          !speedMenuRef.current
        ) {
          return;
        }

        if (
          !speedMenuRef.current.contains(
            event.target as Node,
          )
        ) {
          setIsSpeedOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);


  const handleSeekChange =
    (
      event:
        React.ChangeEvent<HTMLInputElement>,
    ) => {
      onSeek(
        Number(
          event.target.value,
        ),
      );
    };


  const handleVolumeChange =
    (
      event:
        React.ChangeEvent<HTMLInputElement>,
    ) => {
      onVolumeChange(
        Number(
          event.target.value,
        ),
      );
    };


  const handleSpeedSelect =
    (rate: number) => {
      onPlaybackRateChange(
        rate,
      );

      setIsSpeedOpen(false);
    };


  return (
    <div className="audio-controls">

      {/* ===================================================
          PLAY
      =================================================== */}

      <button
        type="button"
        className="audio-control-button audio-play-button"
        onClick={
          onPlayPause
        }
        aria-label={
          isPlaying
            ? "Pause"
            : "Play"
        }
      >
        {isPlaying ? (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect
              x="7"
              y="5"
              width="3.5"
              height="14"
              rx="1"
            />

            <rect
              x="13.5"
              y="5"
              width="3.5"
              height="14"
              rx="1"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5.5V18.5C8 19.3 8.9 19.8 9.6 19.4L18 13.1C18.6 12.7 18.6 11.8 18 11.4L9.6 5.1C8.9 4.6 8 5.1 8 5.5Z" />
          </svg>
        )}
      </button>


      {/* ===================================================
          CURRENT TIME
      =================================================== */}

      <span className="audio-time">
        {formatTime(
          safeCurrentTime,
        )}
      </span>


      {/* ===================================================
          SEEK
      =================================================== */}

      <input
        type="range"
        className="audio-progress"
        min="0"
        max={safeDuration}
        step="0.01"
        value={
          safeCurrentTime
        }
        onChange={
          handleSeekChange
        }
        aria-label="Progress audio"
      />


      {/* ===================================================
          TOTAL TIME
      =================================================== */}

      <span className="audio-time audio-duration">
        {formatTime(
          safeDuration,
        )}
      </span>


      {/* ===================================================
          DIVIDER
      =================================================== */}

      <span className="audio-control-divider" />


      {/* ===================================================
          VOLUME
      =================================================== */}

      <button
        type="button"
        className="audio-control-button audio-volume-button"
        onClick={() => {
          onVolumeChange(
            volume > 0
              ? 0
              : 1,
          );
        }}
        aria-label={
          volume > 0
            ? "Mute"
            : "Unmute"
        }
      >
        {volume === 0 ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 10V14H8L13 18V6L8 10H4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M17 9L21 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M21 9L17 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 10V14H8L13 18V6L8 10H4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M16 9C17.1 10.1 17.1 13.9 16 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M18.5 6.5C21.2 9.2 21.2 14.8 18.5 17.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>


      {/* ===================================================
          VOLUME SLIDER
      =================================================== */}

      <input
        type="range"
        className="audio-volume"
        min="0"
        max="1"
        step="0.01"
        value={
          volume
        }
        onChange={
          handleVolumeChange
        }
        aria-label="Volume"
      />


      {/* ===================================================
          DIVIDER
      =================================================== */}

      <span className="audio-control-divider" />


      {/* ===================================================
          SPEED DROPDOWN
      =================================================== */}

      <div
        ref={speedMenuRef}
        className="audio-speed-wrapper"
      >
        <button
          type="button"
          className="audio-speed-button"
          onClick={() =>
            setIsSpeedOpen(
              (value) =>
                !value,
            )
          }
          aria-haspopup="menu"
          aria-expanded={
            isSpeedOpen
          }
        >
          <span>
            {playbackRate}x
          </span>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7 10L12 15L17 10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>


        {isSpeedOpen && (
          <div
            className="audio-speed-menu"
            role="menu"
          >
            {PLAYBACK_RATES.map(
              (rate) => (
                <button
                  key={rate}
                  type="button"
                  className={
                    `audio-speed-option ${
                      playbackRate ===
                      rate
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    handleSpeedSelect(
                      rate,
                    )
                  }
                  role="menuitem"
                >
                  {rate}x
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioControls;