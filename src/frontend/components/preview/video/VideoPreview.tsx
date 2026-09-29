import {
  useEffect,
  useRef,
  useState,
} from "react";

import "../../../styles/video.css";
import "../../../styles/preview-common.css";
import "../../../styles/media-playback.css";

import FullscreenButton from "../common/FullscreenButton";
import MediaPlaybackControls from "../common/MediaPlaybackControls";

interface VideoPreviewProps {
  src: string;
  fileName?: string;
}

function VideoPreview({
  src,
}: VideoPreviewProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const containerRef =
    useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolume] =
    useState(1);

  const [playbackRate, setPlaybackRate] =
    useState(1);

  const [hasError, setHasError] =
    useState(false);


  /* =======================================================
     RESET
  ======================================================= */

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    video.pause();

    video.currentTime = 0;

    video.volume = 1;

    video.playbackRate = 1;

    setIsPlaying(false);

    setCurrentTime(0);

    setDuration(0);

    setVolume(1);

    setPlaybackRate(1);

    setHasError(false);
  }, [src]);


  /* =======================================================
     VIDEO EVENTS
  ======================================================= */

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }


    const onLoadedMetadata =
      () => {
        setDuration(
          Number.isFinite(
            video.duration,
          )
            ? video.duration
            : 0,
        );
      };


    const onTimeUpdate =
      () => {
        setCurrentTime(
          video.currentTime,
        );
      };


    const onPlay =
      () => {
        setIsPlaying(true);
      };


    const onPause =
      () => {
        setIsPlaying(false);
      };


    const onEnded =
      () => {
        setIsPlaying(false);
      };


    const onError =
      () => {
        setHasError(true);

        setIsPlaying(false);
      };


    video.addEventListener(
      "loadedmetadata",
      onLoadedMetadata,
    );

    video.addEventListener(
      "timeupdate",
      onTimeUpdate,
    );

    video.addEventListener(
      "play",
      onPlay,
    );

    video.addEventListener(
      "pause",
      onPause,
    );

    video.addEventListener(
      "ended",
      onEnded,
    );

    video.addEventListener(
      "error",
      onError,
    );


    return () => {
      video.removeEventListener(
        "loadedmetadata",
        onLoadedMetadata,
      );

      video.removeEventListener(
        "timeupdate",
        onTimeUpdate,
      );

      video.removeEventListener(
        "play",
        onPlay,
      );

      video.removeEventListener(
        "pause",
        onPause,
      );

      video.removeEventListener(
        "ended",
        onEnded,
      );

      video.removeEventListener(
        "error",
        onError,
      );
    };
  }, [src]);


  /* =======================================================
     PLAY / PAUSE
  ======================================================= */

  const handlePlayPause =
    async () => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }


      try {
        if (video.paused) {
          await video.play();
        } else {
          video.pause();
        }
      } catch (error) {
        console.error(
          "[Archio] Video play error:",
          error,
        );
      }
    };


  /* =======================================================
     SEEK
  ======================================================= */

  const handleSeek =
    (time: number) => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }


      const newTime =
        Math.max(
          0,
          Math.min(
            time,
            duration || 0,
          ),
        );


      video.currentTime =
        newTime;


      setCurrentTime(
        newTime,
      );
    };


  /* =======================================================
     VOLUME
  ======================================================= */

  const handleVolume =
    (value: number) => {
      const video =
        videoRef.current;


      const nextVolume =
        Math.max(
          0,
          Math.min(
            value,
            1,
          ),
        );


      setVolume(
        nextVolume,
      );


      if (video) {
        video.volume =
          nextVolume;
      }
    };


  /* =======================================================
     SPEED
  ======================================================= */

  const handlePlaybackRate =
    (rate: number) => {
      setPlaybackRate(
        rate,
      );


      if (videoRef.current) {
        videoRef.current.playbackRate =
          rate;
      }
    };


  /* =======================================================
     KEYBOARD SHORTCUTS
     
     Space       = Play / Pause
     ArrowRight  = Forward 5 seconds
     ArrowLeft   = Back 5 seconds
     ArrowUp     = Volume +10%
     ArrowDown   = Volume -10%
     M           = Mute / Unmute
  ======================================================= */

  useEffect(() => {
    const handleKeyDown =
      (event: KeyboardEvent) => {
        const video =
          videoRef.current;

        if (!video) {
          return;
        }


        /*
         * Jangan mengambil alih keyboard
         * ketika user sedang mengetik.
         */

        const target =
          event.target as HTMLElement | null;


        if (target) {
          const tagName =
            target.tagName.toLowerCase();


          if (
            tagName === "input" ||
            tagName === "textarea" ||
            tagName === "select" ||
            target.isContentEditable
          ) {
            return;
          }
        }


        /*
         * Jangan menjalankan shortcut
         * jika focus sedang berada di
         * button lain.
         *
         * Ini penting agar tombol ActionBar
         * tetap bekerja normal.
         */

        if (
          target?.closest(
            "button, [role='button']",
          )
        ) {
          return;
        }


        switch (event.code) {

          /* ===============================================
             SPACE
             Play / Pause
          =============================================== */

          case "Space": {
            event.preventDefault();

            void handlePlayPause();

            break;
          }


          /* ===============================================
             ARROW RIGHT
             Forward 5 seconds
          =============================================== */

          case "ArrowRight": {
            event.preventDefault();

            const nextTime =
              Math.min(
                video.currentTime +
                  5,
                video.duration ||
                  duration ||
                  0,
              );


            video.currentTime =
              nextTime;


            setCurrentTime(
              nextTime,
            );

            break;
          }


          /* ===============================================
             ARROW LEFT
             Back 5 seconds
          =============================================== */

          case "ArrowLeft": {
            event.preventDefault();

            const previousTime =
              Math.max(
                video.currentTime -
                  5,
                0,
              );


            video.currentTime =
              previousTime;


            setCurrentTime(
              previousTime,
            );

            break;
          }


          /* ===============================================
             ARROW UP
             Volume +10%
          =============================================== */

          case "ArrowUp": {
            event.preventDefault();

            const nextVolume =
              Math.min(
                video.volume +
                  0.1,
                1,
              );


            handleVolume(
              nextVolume,
            );

            break;
          }


          /* ===============================================
             ARROW DOWN
             Volume -10%
          =============================================== */

          case "ArrowDown": {
            event.preventDefault();

            const nextVolume =
              Math.max(
                video.volume -
                  0.1,
                0,
              );


            handleVolume(
              nextVolume,
            );

            break;
          }


          /* ===============================================
             M
             Mute / Unmute
          =============================================== */

          case "KeyM": {
            event.preventDefault();

            if (
              video.volume > 0
            ) {
              video.dataset.archioPreviousVolume =
                String(
                  video.volume,
                );

              handleVolume(0);
            } else {
              const previousVolume =
                Number(
                  video.dataset
                    .archioPreviousVolume ||
                    "1",
                );


              handleVolume(
                previousVolume > 0
                  ? previousVolume
                  : 1,
              );
            }

            break;
          }


          default:
            break;
        }
      };


    window.addEventListener(
      "keydown",
      handleKeyDown,
    );


    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    duration,
    handlePlayPause,
  ]);


  /* =======================================================
     ERROR
  ======================================================= */

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className="video-preview video-preview-error"
      >
        <FullscreenButton
          targetRef={
            containerRef
          }
        />


        <div className="video-preview-error-content">

          <div className="video-preview-error-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3L21 20H3L12 3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              <path
                d="M12 9V13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <circle
                cx="12"
                cy="16.5"
                r="0.8"
                fill="currentColor"
              />
            </svg>
          </div>


          <h3>
            Preview tidak tersedia
          </h3>


          <p>
            Video tidak dapat
            diputar oleh Archio.
          </p>

        </div>
      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      ref={containerRef}
      className="video-preview"
      tabIndex={0}
    >

      <video
        ref={videoRef}
        className="video-preview-element"
        src={src}
        preload="metadata"
        playsInline
      />


      {/* =================================================
          FULLSCREEN
      ================================================= */}

      <FullscreenButton
        targetRef={
          containerRef
        }
      />


      {/* =================================================
          SHARED PLAYBACK
      ================================================= */}

      <MediaPlaybackControls
        isPlaying={
          isPlaying
        }
        currentTime={
          currentTime
        }
        duration={
          duration
        }
        volume={
          volume
        }
        playbackRate={
          playbackRate
        }
        onPlayPause={
          handlePlayPause
        }
        onSeek={
          handleSeek
        }
        onVolumeChange={
          handleVolume
        }
        onPlaybackRateChange={
          handlePlaybackRate
        }
      />

    </div>
  );
}

export default VideoPreview;