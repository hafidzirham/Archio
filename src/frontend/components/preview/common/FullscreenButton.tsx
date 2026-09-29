import {
  RefObject,
  useEffect,
  useState,
} from "react";

import "../../../styles/fullscreen-button.css";

interface FullscreenButtonProps {
  targetRef: RefObject<HTMLElement | null>;
}

function FullscreenButton({
  targetRef,
}: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] =
    useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ===
          targetRef.current,
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [targetRef]);

  const toggleFullscreen = async () => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch (error) {
      console.error(
        "[Archio] Fullscreen error:",
        error,
      );
    }
  };

  return (
    <button
      type="button"
      className="fullscreen-button"
      onClick={toggleFullscreen}
      aria-label={
        isFullscreen
          ? "Keluar dari fullscreen"
          : "Fullscreen"
      }
      title={
        isFullscreen
          ? "Keluar dari fullscreen"
          : "Fullscreen"
      }
    >
      {isFullscreen ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 4H4V9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M15 4H20V9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M9 20H4V15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M15 20H20V15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 9V4H9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M15 4H20V9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M20 15V20H15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M9 20H4V15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export default FullscreenButton;