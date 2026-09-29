import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { renderPresentation } from "../../../services/presentationService";
import FullscreenButton from "../common/FullscreenButton";

interface PresentationSlide {
  index: number;
  image: string;
}

interface PresentationPreviewResult {
  fileName: string;
  extension: string;
  totalSlides: number;
  slides: PresentationSlide[];

  benchmark?: {
    open: number;
    total: number;
  };
}

interface PresentationPreviewProps {
  src: string;
  fileName: string;
}

const THUMBNAIL_COUNT = 4;

export default function PresentationPreview({
  src,
  fileName,
}: PresentationPreviewProps) {
  /* =========================================================
     THEME
  ========================================================= */

  const [isDarkTheme, setIsDarkTheme] = useState(
    () =>
      document.documentElement.dataset.theme ===
      "dark",
  );

  useEffect(() => {
    const root =
      document.documentElement;

    const updateTheme = () => {
      setIsDarkTheme(
        root.dataset.theme === "dark",
      );
    };

    updateTheme();

    const observer =
      new MutationObserver(
        updateTheme,
      );

    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        "data-theme",
      ],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  /* =========================================================
     THEME COLORS
  ========================================================= */

  const viewerBackground =
    isDarkTheme
      ? "#272727"
      : "#ffffff";

  const outerFullscreenBackground =
    isDarkTheme
      ? "#1f1f1f"
      : "#ffffff";

  const loadingTextColor =
    isDarkTheme
      ? "#bdbdbd"
      : "#555555";

  const loadingSubtitleColor =
    isDarkTheme
      ? "#777777"
      : "#999999";

  const spinnerBorder =
    isDarkTheme
      ? "2px solid rgba(255,255,255,0.15)"
      : "2px solid rgba(0,0,0,0.12)";

  const spinnerBorderTop =
    isDarkTheme
      ? "2px solid #ffffff"
      : "2px solid #555555";

  const thumbnailBackground =
    isDarkTheme
      ? "#1f1f1f"
      : "#eeeeee";

  const thumbnailBorder =
    isDarkTheme
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid rgba(0,0,0,0.10)";

  const thumbnailActiveBorder =
    isDarkTheme
      ? "2px solid #ffffff"
      : "2px solid #555555";

  const thumbnailSpinnerBorder =
    isDarkTheme
      ? "2px solid rgba(255,255,255,0.18)"
      : "2px solid rgba(0,0,0,0.12)";

  const thumbnailSpinnerTop =
    isDarkTheme
      ? "2px solid #ffffff"
      : "2px solid #555555";

  const thumbnailLoadingTextColor =
    isDarkTheme
      ? "rgba(255,255,255,0.45)"
      : "#888888";

  const slideCounterColor =
    isDarkTheme
      ? "#ffffff"
      : "#333333";

  const progressBackground =
    isDarkTheme
      ? "rgba(255,255,255,0.16)"
      : "rgba(0,0,0,0.14)";

  const progressFillColor =
    isDarkTheme
      ? "#ffffff"
      : "#666666";

  const navigationButtonBackground =
    isDarkTheme
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.08)";

  const navigationButtonColor =
    isDarkTheme
      ? "#ffffff"
      : "#333333";

  /* =========================================================
     STATE
  ========================================================= */

  const [result, setResult] =
    useState<PresentationPreviewResult | null>(
      null,
    );

  const [currentSlide, setCurrentSlide] =
    useState(0);

  const [displayedSlide, setDisplayedSlide] =
    useState<PresentationSlide | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [slideLoading, setSlideLoading] =
    useState(false);

  const [renderTime, setRenderTime] =
    useState<number | null>(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  /* =========================================================
     SLIDE CACHE
  ========================================================= */

  const slideCacheRef =
    useRef<
      Map<number, PresentationSlide>
    >(new Map());

  /* =========================================================
     REQUEST ID
  ========================================================= */

  const renderRequestRef =
    useRef(0);

  /* =========================================================
     LOAD PRESENTATION
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    slideCacheRef.current.clear();

    setResult(null);
    setCurrentSlide(0);
    setDisplayedSlide(null);
    setError(null);
    setLoading(true);
    setSlideLoading(false);
    setRenderTime(null);

    async function loadPresentation() {
      const startTime =
        performance.now();

      const requestId =
        ++renderRequestRef.current;

      try {
        console.time(
          "[PresentationPreview] Initial render",
        );

        const parsedResult =
          await renderPresentation(
            src,
            0,
          );

        const elapsed =
          performance.now() -
          startTime;

        console.timeEnd(
          "[PresentationPreview] Initial render",
        );

        console.log(
          `[PresentationPreview] Initial render selesai dalam ${elapsed.toFixed(
            0,
          )} ms (${(
            elapsed / 1000
          ).toFixed(2)} s)`,
        );

        if (
          cancelled ||
          requestId !==
            renderRequestRef.current
        ) {
          return;
        }

        setResult(
          parsedResult,
        );

        const firstSlide =
          parsedResult.slides?.find(
            (slide) =>
              slide.index === 0,
          ) ??
          parsedResult.slides?.[0];

        if (firstSlide) {
          slideCacheRef.current.set(
            firstSlide.index,
            firstSlide,
          );

          setDisplayedSlide(
            firstSlide,
          );
        }

        setCurrentSlide(0);
        setRenderTime(elapsed);
        setError(null);
      } catch (err) {
        const elapsed =
          performance.now() -
          startTime;

        console.timeEnd(
          "[PresentationPreview] Initial render",
        );

        console.error(
          `[PresentationPreview] Render gagal setelah ${elapsed.toFixed(
            0,
          )} ms`,
        );

        console.error(err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : String(err),
          );

          setRenderTime(
            elapsed,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPresentation();

    return () => {
      cancelled = true;
    };
  }, [src]);

  /* =========================================================
     RENDER SINGLE SLIDE
  ========================================================= */

  useEffect(() => {
    if (!result) {
      return;
    }

    const totalSlideCount =
      result.totalSlides;

    const cachedSlide =
      slideCacheRef.current.get(
        currentSlide,
      );

    if (cachedSlide) {
      setDisplayedSlide(
        cachedSlide,
      );

      setSlideLoading(false);

      return;
    }

    let cancelled = false;

    const requestId =
      ++renderRequestRef.current;

    async function loadSlide() {
      const startTime =
        performance.now();

      try {
        setSlideLoading(true);
        setError(null);

        console.log(
          `[PresentationPreview] Rendering slide ${
            currentSlide + 1
          }/${totalSlideCount}...`,
        );

        const slideResult =
          await renderPresentation(
            src,
            currentSlide,
          );

        const elapsed =
          performance.now() -
          startTime;

        if (
          cancelled ||
          requestId !==
            renderRequestRef.current
        ) {
          return;
        }

        const slide =
          slideResult.slides?.find(
            (item) =>
              item.index ===
              currentSlide,
          ) ??
          slideResult.slides?.[0];

        if (!slide) {
          throw new Error(
            `Slide ${
              currentSlide + 1
            } tidak berhasil dirender.`,
          );
        }

        slideCacheRef.current.set(
          slide.index,
          slide,
        );

        setDisplayedSlide(
          slide,
        );

        console.log(
          `[PresentationPreview] Slide ${
            currentSlide + 1
          } selesai dalam ${elapsed.toFixed(
            0,
          )} ms`,
        );
      } catch (err) {
        if (
          cancelled ||
          requestId !==
            renderRequestRef.current
        ) {
          return;
        }

        console.error(
          "[PresentationPreview] Slide render gagal:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : String(err),
        );
      } finally {
        if (
          !cancelled &&
          requestId ===
            renderRequestRef.current
        ) {
          setSlideLoading(false);
        }
      }
    }

    void loadSlide();

    return () => {
      cancelled = true;
    };
  }, [
    currentSlide,
    result,
    src,
  ]);

  /* =========================================================
     DATA
  ========================================================= */

  const totalSlides =
    result?.totalSlides ?? 0;

  /* =========================================================
     THUMBNAIL WINDOW
  ========================================================= */

  let thumbnailStart = 0;

  if (
    totalSlides >
    THUMBNAIL_COUNT
  ) {
    thumbnailStart =
      Math.min(
        currentSlide -
          (THUMBNAIL_COUNT - 1),
        totalSlides -
          THUMBNAIL_COUNT,
      );

    thumbnailStart =
      Math.max(
        0,
        thumbnailStart,
      );
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goPrevious =
    useCallback(() => {
      if (
        totalSlides === 0
      ) {
        return;
      }

      setCurrentSlide(
        (current) =>
          current > 0
            ? current - 1
            : totalSlides - 1,
      );
    }, [
      totalSlides,
    ]);

  const goNext =
    useCallback(() => {
      if (
        totalSlides === 0
      ) {
        return;
      }

      setCurrentSlide(
        (current) =>
          current <
          totalSlides - 1
            ? current + 1
            : 0,
      );
    }, [
      totalSlides,
    ]);

  /* =========================================================
     KEYBOARD
  ========================================================= */

  useEffect(() => {
    function handleKeyboard(
      event: KeyboardEvent,
    ) {
      if (
        totalSlides === 0
      ) {
        return;
      }

      if (
        event.target instanceof
          HTMLInputElement ||
        event.target instanceof
          HTMLTextAreaElement ||
        (
          event.target instanceof
            HTMLElement &&
          event.target.isContentEditable
        )
      ) {
        return;
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {
        event.preventDefault();
        goPrevious();
        return;
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        event.preventDefault();
        goNext();
        return;
      }

      if (
        event.key ===
          "Escape" &&
        document.fullscreenElement
      ) {
        void document.exitFullscreen();
      }
    }

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
  }, [
    totalSlides,
    goPrevious,
    goNext,
  ]);

  /* =========================================================
     PROGRESS
  ========================================================= */

  const progress =
    totalSlides > 1
      ? currentSlide /
        (totalSlides - 1)
      : 0;

  /* =========================================================
     PROGRESS CLICK
  ========================================================= */

  const handleProgressClick = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (
      totalSlides <= 1
    ) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const position =
      event.clientX -
      rect.left;

    const ratio =
      Math.max(
        0,
        Math.min(
          1,
          position /
            rect.width,
        ),
      );

    const slide =
      Math.round(
        ratio *
          (totalSlides - 1),
      );

    setCurrentSlide(
      slide,
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "presentation-preview presentation-preview-fullscreen"
          : "presentation-preview"
      }
      style={{
        width: "100%",

        height: isFullscreen
          ? "100vh"
          : "auto",

        background:
          isFullscreen
            ? outerFullscreenBackground
            : "transparent",

        fontFamily:
          "Urbanist, sans-serif",

        boxSizing:
          "border-box",

        display: "flex",

        flexDirection:
          "column",

        alignItems:
          "center",

        overflow:
          isFullscreen
            ? "hidden"
            : "visible",
      }}
    >
      {/* ====================================================
          PRESENTATION CARD
      ==================================================== */}

      <div
        style={{
          width: "100%",

          height: isFullscreen
            ? "100vh"
            : "562px",

          /*
           * LIGHT  = WHITE
           * DARK   = #272727
           */
          background:
            viewerBackground,

          borderRadius:
            isFullscreen
              ? "0px"
              : "23px",

          display: "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          boxSizing:
            "border-box",

          padding: isFullscreen
            ? "32px 48px 24px"
            : "24px 32px 18px",

          overflow: "hidden",

          position: "relative",

          transition:
            "background-color 0.2s ease",
        }}
      >
        {/* ====================================================
            FULLSCREEN BUTTON
        ==================================================== */}

        <FullscreenButton
          targetRef={containerRef}
          onFullscreenChange={
            setIsFullscreen
          }
        />

        {/* ====================================================
            INITIAL LOADING
        ==================================================== */}

        {loading && (
          <div
            style={{
              flex: 1,

              width: "100%",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              color:
                loadingTextColor,

              fontSize: "14px",

              flexDirection:
                "column",

              gap: "12px",
            }}
          >
            <div
              style={{
                width: "22px",

                height: "22px",

                border:
                  spinnerBorder,

                borderTop:
                  spinnerBorderTop,

                borderRadius:
                  "50%",

                animation:
                  "archio-presentation-spin 0.8s linear infinite",
              }}
            />

            <div>
              Rendering
              presentation...
            </div>

            <div
              style={{
                fontSize:
                  "12px",

                color:
                  loadingSubtitleColor,
              }}
            >
              Preparing slide 1
            </div>

            <style>
              {`
                @keyframes archio-presentation-spin {
                  from {
                    transform: rotate(0deg);
                  }

                  to {
                    transform: rotate(360deg);
                  }
                }
              `}
            </style>
          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loading &&
          error &&
          !displayedSlide && (
            <div
              style={{
                flex: 1,

                width: "100%",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                color:
                  isDarkTheme
                    ? "#ff8a80"
                    : "#d84843",

                fontSize: "14px",

                textAlign:
                  "center",

                padding: "30px",

                boxSizing:
                  "border-box",

                flexDirection:
                  "column",

                gap: "10px",
              }}
            >
              <div>
                Preview unavailable
              </div>

              <div
                style={{
                  fontSize:
                    "12px",

                  color:
                    isDarkTheme
                      ? "#888888"
                      : "#777777",

                  maxWidth:
                    "600px",

                  wordBreak:
                    "break-word",
                }}
              >
                {error}
              </div>

              {renderTime !==
                null && (
                <div
                  style={{
                    fontSize:
                      "11px",

                    color:
                      isDarkTheme
                        ? "#666666"
                        : "#999999",
                  }}
                >
                  Failed after{" "}
                  {(
                    renderTime /
                    1000
                  ).toFixed(2)}
                  s
                </div>
              )}
            </div>
          )}

        {/* ====================================================
            PRESENTATION
        ==================================================== */}

        {!loading &&
          result &&
          displayedSlide && (
            <>
              {/* ==============================================
                  MAIN SLIDE
              ============================================== */}

              <div
                style={{
                  flex: 1,

                  width: "100%",

                  minHeight: 0,

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  position:
                    "relative",

                  overflow:
                    "hidden",
                }}
              >
                <img
                  src={
                    displayedSlide.image
                  }
                  alt={`${fileName} - Slide ${
                    displayedSlide.index +
                    1
                  }`}
                  style={{
                    maxWidth:
                      "100%",

                    maxHeight:
                      "100%",

                    width: "auto",

                    height: "auto",

                    objectFit:
                      "contain",

                    display:
                      "block",

                    opacity:
                      slideLoading
                        ? 0.72
                        : 1,

                    transition:
                      "opacity 0.15s ease",
                  }}
                />

                {/* RENDERING OVERLAY */}

                {slideLoading && (
                  <div
                    style={{
                      position:
                        "absolute",

                      inset: 0,

                      display: "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      background:
                        isDarkTheme
                          ? "rgba(0,0,0,0.18)"
                          : "rgba(255,255,255,0.18)",

                      backdropFilter:
                        "blur(2px)",

                      WebkitBackdropFilter:
                        "blur(2px)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap: "10px",

                        padding:
                          "9px 14px",

                        borderRadius:
                          "10px",

                        background:
                          isDarkTheme
                            ? "rgba(0,0,0,0.72)"
                            : "rgba(255,255,255,0.88)",

                        color:
                          isDarkTheme
                            ? "#ffffff"
                            : "#333333",

                        fontSize:
                          "13px",

                        fontWeight: 500,

                        boxShadow:
                          "0 4px 20px rgba(0,0,0,0.18)",
                      }}
                    >
                      <div
                        style={{
                          width:
                            "15px",

                          height:
                            "15px",

                          border:
                            isDarkTheme
                              ? "2px solid rgba(255,255,255,0.25)"
                              : "2px solid rgba(0,0,0,0.15)",

                          borderTop:
                            isDarkTheme
                              ? "2px solid #ffffff"
                              : "2px solid #555555",

                          borderRadius:
                            "50%",

                          animation:
                            "archio-presentation-spin 0.8s linear infinite",
                        }}
                      />

                      Rendering
                      slide{" "}
                      {currentSlide +
                        1}
                      ...
                    </div>
                  </div>
                )}

                {/* RENDER ERROR */}

                {error &&
                  !slideLoading && (
                    <div
                      style={{
                        position:
                          "absolute",

                        left: "50%",

                        bottom:
                          "16px",

                        transform:
                          "translateX(-50%)",

                        padding:
                          "8px 12px",

                        borderRadius:
                          "8px",

                        background:
                          "rgba(120,0,0,0.82)",

                        color:
                          "#ffffff",

                        fontSize:
                          "11px",

                        maxWidth:
                          "80%",

                        textAlign:
                          "center",
                      }}
                    >
                      {error}
                    </div>
                  )}
              </div>

              {/* ==============================================
                  THUMBNAILS
              ============================================== */}

              <div
                style={{
                  width: "100%",

                  height: "62px",

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  gap: "12px",

                  marginTop:
                    "12px",

                  flexShrink: 0,
                }}
              >
                {Array.from({
                  length:
                    Math.min(
                      THUMBNAIL_COUNT,
                      totalSlides,
                    ),
                }).map(
                  (
                    _,
                    slotIndex,
                  ) => {
                    const slideIndex =
                      thumbnailStart +
                      slotIndex;

                    const slide =
                      slideCacheRef.current.get(
                        slideIndex,
                      );

                    const active =
                      slideIndex ===
                      currentSlide;

                    return (
                      <button
                        key={`thumbnail-slot-${slotIndex}`}
                        type="button"
                        onClick={() =>
                          setCurrentSlide(
                            slideIndex,
                          )
                        }
                        aria-label={`Go to slide ${
                          slideIndex +
                          1
                        }`}
                        style={{
                          width:
                            "120px",

                          height:
                            "62px",

                          minWidth:
                            "120px",

                          minHeight:
                            "62px",

                          padding: 0,

                          margin: 0,

                          boxSizing:
                            "border-box",

                          border:
                            active
                              ? thumbnailActiveBorder
                              : thumbnailBorder,

                          borderRadius:
                            "3px",

                          background:
                            thumbnailBackground,

                          overflow:
                            "hidden",

                          cursor:
                            "pointer",

                          opacity:
                            active
                              ? 1
                              : 0.48,

                          flexShrink: 0,

                          transition:
                            "opacity 0.15s ease, border-color 0.15s ease",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          position:
                            "relative",
                        }}
                      >
                        {slide ? (
                          <img
                            src={
                              slide.image
                            }
                            alt={`Slide ${
                              slideIndex +
                              1
                            }`}
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                              objectFit:
                                "cover",

                              display:
                                "block",

                              pointerEvents:
                                "none",
                            }}
                          />
                        ) : (
                          <>
                            <div
                              style={{
                                width:
                                  "13px",

                                height:
                                  "13px",

                                border:
                                  thumbnailSpinnerBorder,

                                borderTop:
                                  thumbnailSpinnerTop,

                                borderRadius:
                                  "50%",

                                animation:
                                  "archio-presentation-spin 0.8s linear infinite",
                              }}
                            />

                            <span
                              style={{
                                position:
                                  "absolute",

                                bottom:
                                  "5px",

                                left: 0,

                                right: 0,

                                textAlign:
                                  "center",

                                fontSize:
                                  "8px",

                                color:
                                  thumbnailLoadingTextColor,
                              }}
                            >
                              Rendering...
                            </span>
                          </>
                        )}
                      </button>
                    );
                  },
                )}
              </div>

              {/* ==============================================
                  NAVIGATION
              ============================================== */}

              <div
                style={{
                  position:
                    "relative",

                  width:
                    "190px",

                  height:
                    "53px",

                  marginTop:
                    "5px",

                  flexShrink: 0,
                }}
              >
                {/* SLIDE COUNTER */}

                <div
                  style={{
                    position:
                      "absolute",

                    top: 0,

                    left: "50%",

                    transform:
                      "translateX(-50%)",

                    width:
                      "120px",

                    height:
                      "18px",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    color:
                      slideCounterColor,

                    fontSize:
                      "12px",

                    fontWeight:
                      500,

                    lineHeight:
                      "18px",
                  }}
                >
                  Slide{" "}
                  {currentSlide +
                    1}{" "}
                  dari{" "}
                  {totalSlides}
                </div>

                {/* PROGRESS BAR */}

                <div
                  onClick={
                    handleProgressClick
                  }
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(
                    totalSlides -
                      1,
                    0,
                  )}
                  aria-valuenow={
                    currentSlide
                  }
                  style={{
                    position:
                      "absolute",

                    top: "24px",

                    left: "50%",

                    transform:
                      "translateX(-50%)",

                    width:
                      "120px",

                    height: "4px",

                    background:
                      progressBackground,

                    borderRadius:
                      "999px",

                    overflow:
                      "hidden",

                    cursor:
                      totalSlides >
                      1
                        ? "pointer"
                        : "default",
                  }}
                >
                  <div
                    style={{
                      width: `${
                        progress *
                        100
                      }%`,

                      height:
                        "100%",

                      background:
                        progressFillColor,

                      borderRadius:
                        "999px",

                      transition:
                        "width 0.15s ease",
                    }}
                  />
                </div>

                {/* PREVIOUS */}

                <button
                  type="button"
                  onClick={
                    goPrevious
                  }
                  aria-label="Previous slide"
                  style={{
                    position:
                      "absolute",

                    left: 0,

                    top: "24px",

                    transform:
                      "translateY(-50%)",

                    width:
                      "24px",

                    height:
                      "24px",

                    padding: 0,

                    border:
                      "none",

                    borderRadius:
                      "50%",

                    background:
                      navigationButtonBackground,

                    color:
                      navigationButtonColor,

                    cursor:
                      "pointer",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "13px",

                    lineHeight: 1,
                  }}
                >
                  ‹
                </button>

                {/* NEXT */}

                <button
                  type="button"
                  onClick={
                    goNext
                  }
                  aria-label="Next slide"
                  style={{
                    position:
                      "absolute",

                    right: 0,

                    top: "24px",

                    transform:
                      "translateY(-50%)",

                    width:
                      "24px",

                    height:
                      "24px",

                    padding: 0,

                    border:
                      "none",

                    borderRadius:
                      "50%",

                    background:
                      navigationButtonBackground,

                    color:
                      navigationButtonColor,

                    cursor:
                      "pointer",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "13px",

                    lineHeight: 1,
                  }}
                >
                  ›
                </button>
              </div>
            </>
          )}

        {/* ====================================================
            NO SLIDES
        ==================================================== */}

        {!loading &&
          !error &&
          result &&
          totalSlides === 0 && (
            <div
              style={{
                flex: 1,

                width: "100%",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                color:
                  isDarkTheme
                    ? "#bdbdbd"
                    : "#777777",

                fontSize:
                  "14px",
              }}
            >
              Tidak ada slide yang
              dapat ditampilkan.
            </div>
          )}
      </div>
    </div>
  );
}