import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type React from "react";

import * as musicMetadata from "music-metadata-browser";

import MediaPlaybackControls from "../common/MediaPlaybackControls";

import "../../../styles/audio.css";
import "../../../styles/media-playback.css";


interface AudioPreviewProps {
  src: string;
  fileName?: string;
}


/* =========================================================
   WAVEFORM BAR COUNT

   Data waveform TIDAK diubah.
========================================================= */

function getBarCount(
  duration: number,
): number {
  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return 140;
  }

  return Math.min(
    260,
    Math.max(
      120,
      Math.round(
        duration * 5,
      ),
    ),
  );
}


const DEFAULT_ARTWORK =
  "/assets/images/audio-placeholder.png";


function AudioPreview({
  src,
}: AudioPreviewProps) {

  const audioRef =
    useRef<HTMLAudioElement>(null);

  const waveformContainerRef =
    useRef<HTMLDivElement>(null);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);


  /* =======================================================
     STATE
  ======================================================= */

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

  const [waveform, setWaveform] =
    useState<number[] | null>(null);

  const [isLoadingWaveform, setIsLoadingWaveform] =
    useState(true);

  const [waveformError, setWaveformError] =
    useState(false);

  const [artwork, setArtwork] =
    useState(DEFAULT_ARTWORK);


  /* =======================================================
     AUDIO EVENTS
  ======================================================= */

  useEffect(() => {

    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }


    const handleLoadedMetadata =
      () => {

        if (
          Number.isFinite(
            audio.duration,
          )
        ) {
          setDuration(
            audio.duration,
          );
        }
      };


    const handleTimeUpdate =
      () => {

        setCurrentTime(
          audio.currentTime,
        );
      };


    const handlePlay =
      () => {
        setIsPlaying(true);
      };


    const handlePause =
      () => {
        setIsPlaying(false);
      };


    const handleEnded =
      () => {

        setIsPlaying(false);

        setCurrentTime(
          audio.duration,
        );
      };


    const handleError =
      () => {

        console.error(
          "[Archio] Audio playback error:",
          audio.error,
        );
      };


    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata,
    );

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate,
    );

    audio.addEventListener(
      "play",
      handlePlay,
    );

    audio.addEventListener(
      "pause",
      handlePause,
    );

    audio.addEventListener(
      "ended",
      handleEnded,
    );

    audio.addEventListener(
      "error",
      handleError,
    );


    return () => {

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata,
      );

      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );

      audio.removeEventListener(
        "play",
        handlePlay,
      );

      audio.removeEventListener(
        "pause",
        handlePause,
      );

      audio.removeEventListener(
        "ended",
        handleEnded,
      );

      audio.removeEventListener(
        "error",
        handleError,
      );
    };

  }, [src]);


  /* =======================================================
     RESET
  ======================================================= */

  useEffect(() => {

    const audio =
      audioRef.current;

    if (audio) {

      audio.pause();

      audio.currentTime = 0;

      audio.volume = 1;

      audio.playbackRate = 1;
    }


    setIsPlaying(false);

    setCurrentTime(0);

    setDuration(0);

    setVolume(1);

    setPlaybackRate(1);

    setWaveform(null);

    setWaveformError(false);

    setIsLoadingWaveform(true);

  }, [src]);


  /* =======================================================
     ARTWORK
  ======================================================= */

  useEffect(() => {

    let cancelled = false;

    let objectUrl:
      string | null = null;


    const loadArtwork =
      async () => {

        setArtwork(
          DEFAULT_ARTWORK,
        );


        try {

          const response =
            await fetch(src);


          if (!response.ok) {
            throw new Error(
              `Gagal mengambil audio: ${response.status}`,
            );
          }


          const blob =
            await response.blob();


          const metadata =
            await musicMetadata.parseBlob(
              blob,
            );


          if (cancelled) {
            return;
          }


          const pictures =
            metadata.common.picture;


          if (
            !pictures ||
            pictures.length === 0
          ) {
            return;
          }


          const picture =
            pictures[0];


          if (
            !picture ||
            !picture.data ||
            picture.data.length === 0
          ) {
            return;
          }


          const imageBlob =
            new Blob(
              [picture.data],
              {
                type:
                  picture.format ||
                  "image/jpeg",
              },
            );


          objectUrl =
            URL.createObjectURL(
              imageBlob,
            );


          if (!cancelled) {

            setArtwork(
              objectUrl,
            );
          }

        } catch (error) {

          console.warn(
            "[Archio] Tidak dapat membaca embedded artwork:",
            error,
          );
        }
      };


    loadArtwork();


    return () => {

      cancelled = true;


      if (objectUrl) {

        URL.revokeObjectURL(
          objectUrl,
        );
      }
    };

  }, [src]);


  /* =======================================================
     KEYBOARD
  ======================================================= */

  useEffect(() => {

    const handleKeyboard =
      (event: KeyboardEvent) => {

        const audio =
          audioRef.current;

        if (!audio) {
          return;
        }


        const target =
          event.target as HTMLElement | null;


        if (target) {

          const tagName =
            target.tagName.toUpperCase();


          if (
            tagName === "TEXTAREA" ||
            tagName === "SELECT" ||
            target.isContentEditable
          ) {
            return;
          }


          if (
            tagName === "INPUT"
          ) {

            const input =
              target as HTMLInputElement;


            if (
              input.type !== "range"
            ) {
              return;
            }
          }
        }


        /* SPACE */

        if (
          event.code === "Space"
        ) {

          event.preventDefault();

          event.stopPropagation();


          if (audio.paused) {

            audio
              .play()
              .catch(
                (error) => {
                  console.error(
                    "[Archio] Audio play failed:",
                    error,
                  );
                },
              );

          } else {

            audio.pause();
          }

          return;
        }


        /* LEFT */

        if (
          event.key === "ArrowLeft"
        ) {

          event.preventDefault();

          event.stopPropagation();


          const newTime =
            Math.max(
              0,
              audio.currentTime - 5,
            );


          audio.currentTime =
            newTime;

          setCurrentTime(
            newTime,
          );

          return;
        }


        /* RIGHT */

        if (
          event.key === "ArrowRight"
        ) {

          event.preventDefault();

          event.stopPropagation();


          const newTime =
            Math.min(
              Number.isFinite(
                audio.duration,
              )
                ? audio.duration
                : 0,
              audio.currentTime + 5,
            );


          audio.currentTime =
            newTime;

          setCurrentTime(
            newTime,
          );

          return;
        }


        /* UP */

        if (
          event.key === "ArrowUp"
        ) {

          event.preventDefault();

          event.stopPropagation();


          const newVolume =
            Math.min(
              1,
              audio.volume + 0.1,
            );


          audio.volume =
            newVolume;

          setVolume(
            newVolume,
          );


          if (
            newVolume > 0
          ) {

            audio.dataset.archioPreviousVolume =
              String(
                newVolume,
              );
          }

          return;
        }


        /* DOWN */

        if (
          event.key === "ArrowDown"
        ) {

          event.preventDefault();

          event.stopPropagation();


          if (
            audio.volume > 0
          ) {

            audio.dataset.archioPreviousVolume =
              String(
                audio.volume,
              );
          }


          const newVolume =
            Math.max(
              0,
              audio.volume - 0.1,
            );


          audio.volume =
            newVolume;

          setVolume(
            newVolume,
          );

          return;
        }


        /* MUTE */

        if (
          event.key.toLowerCase() ===
          "m"
        ) {

          event.preventDefault();

          event.stopPropagation();


          if (
            audio.volume > 0
          ) {

            audio.dataset.archioPreviousVolume =
              String(
                audio.volume,
              );

            audio.volume = 0;

            setVolume(0);

          } else {

            const previousVolume =
              Number(
                audio.dataset
                  .archioPreviousVolume ||
                  "1",
              );


            const restoredVolume =
              Math.max(
                0.1,
                Math.min(
                  previousVolume,
                  1,
                ),
              );


            audio.volume =
              restoredVolume;

            setVolume(
              restoredVolume,
            );
          }

          return;
        }
      };


    window.addEventListener(
      "keydown",
      handleKeyboard,
      true,
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyboard,
        true,
      );
    };

  }, []);


  /* =======================================================
     GENERATE WAVEFORM
     
     Data waveform TETAP sama.
  ======================================================= */

  useEffect(() => {

    let cancelled = false;

    let audioContext:
      AudioContext | null = null;


    const generateWaveform =
      async () => {

        setIsLoadingWaveform(true);

        setWaveformError(false);

        setWaveform(null);


        try {

          const response =
            await fetch(src);


          if (!response.ok) {
            throw new Error(
              `Gagal mengambil audio: ${response.status}`,
            );
          }


          const arrayBuffer =
            await response.arrayBuffer();


          const AudioContextConstructor =
            window.AudioContext ||
            (
              window as typeof window & {
                webkitAudioContext?:
                  typeof AudioContext;
              }
            ).webkitAudioContext;


          if (!AudioContextConstructor) {
            throw new Error(
              "Web Audio API tidak tersedia.",
            );
          }


          audioContext =
            new AudioContextConstructor();


          const audioBuffer =
            await audioContext.decodeAudioData(
              arrayBuffer.slice(0),
            );


          if (cancelled) {
            return;
          }


          const barCount =
            getBarCount(
              audioBuffer.duration,
            );


          const sampleCount =
            audioBuffer.length;

          const channelCount =
            audioBuffer.numberOfChannels;


          const mixedSamples =
            new Float32Array(
              sampleCount,
            );


          for (
            let channel = 0;
            channel < channelCount;
            channel++
          ) {

            const channelData =
              audioBuffer.getChannelData(
                channel,
              );


            for (
              let i = 0;
              i < sampleCount;
              i++
            ) {

              mixedSamples[i] +=
                channelData[i] /
                channelCount;
            }
          }


          const samplesPerBar =
            Math.max(
              1,
              Math.floor(
                sampleCount /
                  barCount,
              ),
            );


          const peaks: number[] = [];


          for (
            let bar = 0;
            bar < barCount;
            bar++
          ) {

            const start =
              bar *
              samplesPerBar;


            const end =
              bar ===
              barCount - 1
                ? sampleCount
                : Math.min(
                    sampleCount,
                    start +
                      samplesPerBar,
                  );


            let peak = 0;

            let sumSquares = 0;

            let sampleTotal = 0;


            for (
              let i = start;
              i < end;
              i++
            ) {

              const amplitude =
                Math.abs(
                  mixedSamples[i],
                );


              if (
                amplitude >
                peak
              ) {
                peak =
                  amplitude;
              }


              sumSquares +=
                mixedSamples[i] *
                mixedSamples[i];

              sampleTotal++;
            }


            const rms =
              sampleTotal > 0
                ? Math.sqrt(
                    sumSquares /
                      sampleTotal,
                  )
                : 0;


            const combined =
              Math.max(
                peak * 0.72,
                rms * 1.45,
              );


            peaks.push(
              combined,
            );
          }


          const maximumPeak =
            Math.max(
              ...peaks,
              0.0001,
            );


          const normalizedPeaks =
            peaks.map(
              (peak) =>
                peak /
                maximumPeak,
            );


          if (!cancelled) {

            setWaveform(
              normalizedPeaks,
            );
          }

        } catch (error) {

          console.error(
            "[Archio] Waveform generation failed:",
            error,
          );


          if (!cancelled) {

            setWaveformError(
              true,
            );
          }

        } finally {

          if (audioContext) {

            try {

              await audioContext.close();

            } catch {
              // Ignore.
            }
          }


          if (!cancelled) {

            setIsLoadingWaveform(
              false,
            );
          }
        }
      };


    generateWaveform();


    return () => {

      cancelled = true;


      if (audioContext) {

        audioContext
          .close()
          .catch(() => {});
      }
    };

  }, [src]);


  /* =======================================================
     DRAW WAVEFORM

     PENTING:
     Gunakan clientWidth / clientHeight.

     JANGAN menggunakan getBoundingClientRect()
     karena sorting-stage menggunakan CSS transform: scale().
  ======================================================= */

  const drawWaveform =
    useCallback(() => {

      const canvas =
        canvasRef.current;

      const container =
        waveformContainerRef.current;


      if (
        !canvas ||
        !container ||
        !waveform ||
        waveform.length === 0
      ) {
        return;
      }


      /*
       * clientWidth/clientHeight mengambil
       * ukuran layout asli sebelum transform.
       *
       * Ini penting karena .sorting-stage
       * menggunakan transform: scale().
       */

      const width =
        Math.max(
          1,
          Math.floor(
            container.clientWidth,
          ),
        );


      const height =
        Math.max(
          1,
          Math.floor(
            container.clientHeight,
          ),
        );


      const pixelRatio =
        Math.min(
          window.devicePixelRatio || 1,
          2,
        );


      /*
       * Canvas internal resolution.
       */

      canvas.width =
        Math.max(
          1,
          Math.floor(
            width *
              pixelRatio,
          ),
        );


      canvas.height =
        Math.max(
          1,
          Math.floor(
            height *
              pixelRatio,
          ),
        );


      /*
       * CSS size mengikuti ukuran
       * container secara normal.
       */

      canvas.style.width =
        "100%";

      canvas.style.height =
        "100%";


      const context =
        canvas.getContext(
          "2d",
        );


      if (!context) {
        return;
      }


      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0,
      );


      context.clearRect(
        0,
        0,
        width,
        height,
      );


      /*
       * Progress audio.
       */

      const progress =
        duration > 0
          ? Math.max(
              0,
              Math.min(
                currentTime /
                  duration,
                1,
              ),
            )
          : 0;


      /*
       * Bar layout.
       *
       * Sedikit diperlebar supaya waveform
       * tidak terlihat terlalu renggang.
       */

      const barWidth =
        width /
        waveform.length;


      const gap =
        Math.max(
          0.8,
          Math.min(
            1.6,
            barWidth * 0.18,
          ),
        );


      const actualBarWidth =
        Math.max(
          0.8,
          barWidth - gap,
        );


      const centerY =
        height / 2;


      for (
        let i = 0;
        i < waveform.length;
        i++
      ) {

        const peak =
          waveform[i];


        /*
         * Gamma membuat detail waveform
         * kecil tetap terlihat.
         */

        const normalizedHeight =
          Math.max(
            0.055,
            Math.pow(
              peak,
              0.72,
            ),
          );


        /*
         * Waveform menggunakan sekitar
         * 90% tinggi area.
         *
         * Karena waveform container sendiri
         * sudah punya tinggi responsif, hasilnya
         * ikut membesar/mengecil dengan benar.
         */

        const barHeight =
          Math.max(
            3,
            normalizedHeight *
              height *
              0.90,
          );


        const x =
          i *
            barWidth +
          gap / 2;


        const y =
          centerY -
          barHeight / 2;


        const barProgress =
          waveform.length > 1
            ? i /
              (waveform.length - 1)
            : 0;


        const played =
          barProgress <=
          progress;


        context.fillStyle =
          played
            ? "#E9E9E9"
            : "#666666";


        const radius =
          Math.min(
            actualBarWidth / 2,
            2.5,
          );


        context.beginPath();


        context.roundRect(
          x,
          y,
          actualBarWidth,
          barHeight,
          radius,
        );


        context.fill();
      }

    }, [
      waveform,
      currentTime,
      duration,
    ]);


  useEffect(() => {

    drawWaveform();

  }, [
    drawWaveform,
  ]);


  /* =======================================================
     RESPONSIVE WAVEFORM
  ======================================================= */

  useEffect(() => {

    const container =
      waveformContainerRef.current;


    if (!container) {
      return;
    }


    let frame =
      0;


    const resizeObserver =
      new ResizeObserver(
        () => {

          cancelAnimationFrame(
            frame,
          );


          frame =
            requestAnimationFrame(
              () => {
                drawWaveform();
              },
            );
        },
      );


    resizeObserver.observe(
      container,
    );


    /*
     * Tetap dengarkan window resize
     * untuk perubahan ukuran Tauri/WebView.
     */

    const handleWindowResize =
      () => {

        cancelAnimationFrame(
          frame,
        );


        frame =
          requestAnimationFrame(
            () => {
              drawWaveform();
            },
          );
      };


    window.addEventListener(
      "resize",
      handleWindowResize,
    );


    return () => {

      resizeObserver.disconnect();

      window.removeEventListener(
        "resize",
        handleWindowResize,
      );

      cancelAnimationFrame(
        frame,
      );
    };

  }, [
    drawWaveform,
  ]);


  /* =======================================================
     PLAY / PAUSE
  ======================================================= */

  const handlePlayPause =
    async () => {

      const audio =
        audioRef.current;


      if (!audio) {
        return;
      }


      try {

        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }

      } catch (error) {

        console.error(
          "[Archio] Audio playback failed:",
          error,
        );
      }
    };


  /* =======================================================
     SEEK
  ======================================================= */

  const handleSeek =
    (time: number) => {

      const audio =
        audioRef.current;


      if (!audio) {
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


      audio.currentTime =
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


      if (audioRef.current) {

        audioRef.current.volume =
          nextVolume;


        if (
          nextVolume > 0
        ) {

          audioRef.current.dataset.archioPreviousVolume =
            String(
              nextVolume,
            );
        }
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


      if (audioRef.current) {

        audioRef.current.playbackRate =
          rate;
      }
    };


  /* =======================================================
     WAVEFORM SEEK
  ======================================================= */

  const seekFromPointer =
    (clientX: number) => {

      const container =
        waveformContainerRef.current;

      const audio =
        audioRef.current;


      if (
        !container ||
        !audio ||
        duration <= 0
      ) {
        return;
      }


      const rect =
        container.getBoundingClientRect();


      const position =
        Math.max(
          0,
          Math.min(
            clientX -
              rect.left,
            rect.width,
          ),
        );


      const percentage =
        rect.width > 0
          ? position /
            rect.width
          : 0;


      const newTime =
        percentage *
        duration;


      audio.currentTime =
        newTime;

      setCurrentTime(
        newTime,
      );
    };


  /* =======================================================
     WAVEFORM DRAG
  ======================================================= */

  const handlePointerDown =
    (
      event:
        React.PointerEvent<HTMLDivElement>,
    ) => {

      const container =
        event.currentTarget;


      container.setPointerCapture(
        event.pointerId,
      );


      seekFromPointer(
        event.clientX,
      );


      const handlePointerMove =
        (
          moveEvent: PointerEvent,
        ) => {

          seekFromPointer(
            moveEvent.clientX,
          );
        };


      const handlePointerUp =
        () => {

          window.removeEventListener(
            "pointermove",
            handlePointerMove,
          );

          window.removeEventListener(
            "pointerup",
            handlePointerUp,
          );
        };


      window.addEventListener(
        "pointermove",
        handlePointerMove,
      );

      window.addEventListener(
        "pointerup",
        handlePointerUp,
      );
    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="audio-preview">

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />


      {/* ARTWORK */}

      <div className="audio-artwork">

        <img
          src={artwork}
          alt="Audio artwork"
          draggable={false}
        />

      </div>


      {/* WAVEFORM */}

      <div
        ref={waveformContainerRef}
        className="audio-waveform"
        onPointerDown={
          handlePointerDown
        }
      >

        {isLoadingWaveform && (
          <div className="audio-waveform-status">
            Menyiapkan waveform...
          </div>
        )}


        {waveformError && (
          <div className="audio-waveform-status">
            Waveform tidak dapat dibuat
          </div>
        )}


        {!isLoadingWaveform &&
          !waveformError &&
          waveform && (
            <canvas
              ref={canvasRef}
              className="audio-waveform-canvas"
            />
          )}

      </div>


      {/* PLAYBACK */}

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


export default AudioPreview;