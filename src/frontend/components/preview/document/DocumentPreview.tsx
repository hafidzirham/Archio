import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";

import DocumentControls from "./DocumentControls";

import FullscreenButton from "../common/FullscreenButton";

import "../../../styles/document.css";
import "../../../styles/preview-common.css";

/* =========================================================
   PDF.JS WORKER
========================================================= */

pdfjs.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

/* =========================================================
   TYPES
========================================================= */

interface DocumentPreviewProps {
  src: string;
  fileName?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

function DocumentPreview({
  src,
}: DocumentPreviewProps) {
  /* =======================================================
     STATE
  ======================================================= */

  const [numPages, setNumPages] =
    useState(0);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [scale, setScale] =
    useState(1);

  /* =======================================================
     REFERENCES
  ======================================================= */

  const previewRef =
    useRef<HTMLDivElement>(null);

  const sidebarRef =
    useRef<HTMLDivElement>(null);

  const mainRef =
    useRef<HTMLDivElement>(null);

  const pdfDocumentRef =
    useRef<any>(null);

  /* =======================================================
     PDF LOAD SUCCESS
  ======================================================= */

  const handleLoadSuccess =
    useCallback(
      (pdf: any) => {
        console.log(
          "[Archio] PDF loaded:",
          pdf.numPages,
        );

        pdfDocumentRef.current =
          pdf;

        setNumPages(
          pdf.numPages,
        );

        setCurrentPage(1);
        setScale(1);
      },
      [],
    );

  /* =======================================================
     PDF LOAD ERROR
  ======================================================= */

  const handleLoadError =
    useCallback(
      (error: Error) => {
        console.error(
          "[Archio] PDF ERROR:",
          error,
        );
      },
      [],
    );

  /* =======================================================
     RESET WHEN FILE CHANGES
  ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
    setScale(1);

    pdfDocumentRef.current =
      null;
  }, [src]);

  /* =======================================================
     RESET MAIN SCROLL
  ======================================================= */

  const resetMainScroll =
    useCallback(() => {
      requestAnimationFrame(() => {
        if (!mainRef.current) {
          return;
        }

        mainRef.current.scrollTop =
          0;

        mainRef.current.scrollLeft =
          0;
      });
    }, []);

  /* =======================================================
     PAGE NAVIGATION
  ======================================================= */

  const goToPage =
    useCallback(
      (page: number) => {
        if (numPages <= 0) {
          return;
        }

        const nextPage =
          Math.max(
            1,
            Math.min(
              page,
              numPages,
            ),
          );

        setCurrentPage(
          nextPage,
        );

        resetMainScroll();
      },
      [
        numPages,
        resetMainScroll,
      ],
    );

  /* =======================================================
     PREVIOUS PAGE
  ======================================================= */

  const previousPage =
    useCallback(() => {
      setCurrentPage(
        (page) => {
          const next =
            Math.max(
              page - 1,
              1,
            );

          if (next !== page) {
            resetMainScroll();
          }

          return next;
        },
      );
    }, [resetMainScroll]);

  /* =======================================================
     NEXT PAGE
  ======================================================= */

  const nextPage =
    useCallback(() => {
      setCurrentPage(
        (page) => {
          const next =
            Math.min(
              page + 1,
              numPages,
            );

          if (next !== page) {
            resetMainScroll();
          }

          return next;
        },
      );
    }, [
      numPages,
      resetMainScroll,
    ]);

  /* =======================================================
     ZOOM IN
  ======================================================= */

  const zoomIn =
    useCallback(() => {
      setScale(
        (value) => {
          const next =
            Number(
              (
                value + 0.1
              ).toFixed(2),
            );

          return Math.min(
            next,
            3,
          );
        },
      );
    }, []);

  /* =======================================================
     ZOOM OUT
  ======================================================= */

  const zoomOut =
    useCallback(() => {
      setScale(
        (value) => {
          const next =
            Number(
              (
                value - 0.1
              ).toFixed(2),
            );

          return Math.max(
            next,
            0.25,
          );
        },
      );
    }, []);

  /* =======================================================
     TRUE FIT
  ======================================================= */

  const fitPage =
    useCallback(() => {
      if (!mainRef.current) {
        return;
      }

      const pageElement =
        mainRef.current.querySelector(
          ".document-page-stage .react-pdf__Page",
        ) as HTMLElement | null;

      if (!pageElement) {
        return;
      }

      const canvas =
        pageElement.querySelector(
          "canvas",
        ) as HTMLCanvasElement | null;

      if (!canvas) {
        return;
      }

      const currentWidth =
        canvas.clientWidth;

      const currentHeight =
        canvas.clientHeight;

      if (
        currentWidth <= 0 ||
        currentHeight <= 0 ||
        scale <= 0
      ) {
        return;
      }

      const originalWidth =
        currentWidth / scale;

      const originalHeight =
        currentHeight / scale;

      const containerWidth =
        mainRef.current
          .clientWidth;

      const containerHeight =
        mainRef.current
          .clientHeight;

      const availableWidth =
        Math.max(
          100,
          containerWidth - 140,
        );

      const availableHeight =
        Math.max(
          100,
          containerHeight - 135,
        );

      const widthScale =
        availableWidth /
        originalWidth;

      const heightScale =
        availableHeight /
        originalHeight;

      const fitScale =
        Math.min(
          widthScale,
          heightScale,
        );

      const finalScale =
        Math.max(
          0.25,
          Math.min(
            fitScale,
            3,
          ),
        );

      setScale(
        Number(
          finalScale.toFixed(2),
        ),
      );

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!mainRef.current) {
            return;
          }

          mainRef.current.scrollTop =
            0;

          mainRef.current.scrollLeft =
            0;
        });
      });
    }, [scale]);

  /* =======================================================
     INITIAL FIT
  ======================================================= */

  useEffect(() => {
    if (
      numPages <= 0 ||
      !pdfDocumentRef.current
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        fitPage();
      }, 100);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    numPages,
    fitPage,
  ]);

  /* =======================================================
     THUMBNAIL SELECTION
  ======================================================= */

  const selectPage =
    useCallback(
      (page: number) => {
        goToPage(page);
      },
      [goToPage],
    );

  /* =======================================================
     ACTIVE THUMBNAIL
  ======================================================= */

  useEffect(() => {
    if (!sidebarRef.current) {
      return;
    }

    const active =
      sidebarRef.current.querySelector(
        ".document-thumbnail.active",
      ) as HTMLElement | null;

    if (active) {
      active.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentPage]);

  /* =======================================================
     FULLSCREEN RESIZE
  ======================================================= */

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        window.setTimeout(() => {
          if (
            pdfDocumentRef.current &&
            numPages > 0
          ) {
            fitPage();
          }
        }, 100);
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
  }, [
    fitPage,
    numPages,
  ]);

  /* =======================================================
     KEYBOARD
  ======================================================= */

  useEffect(() => {
    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key === "Escape" ||
          event.code === "Escape"
        ) {
          if (
            document.fullscreenElement
          ) {
            event.preventDefault();

            document
              .exitFullscreen()
              .catch(() => {});
          }

          return;
        }

        const target =
          event.target as HTMLElement | null;

        if (target) {
          const tagName =
            target.tagName.toLowerCase();

          if (
            tagName === "input" ||
            tagName === "textarea" ||
            tagName === "select"
          ) {
            return;
          }
        }

        if (
          event.key === "ArrowLeft" ||
          event.code === "ArrowLeft"
        ) {
          event.preventDefault();
          event.stopPropagation();

          previousPage();

          return;
        }

        if (
          event.key === "ArrowRight" ||
          event.code === "ArrowRight"
        ) {
          event.preventDefault();
          event.stopPropagation();

          nextPage();

          return;
        }

        if (
          event.key === "+" ||
          event.key === "=" ||
          event.code === "NumpadAdd"
        ) {
          event.preventDefault();

          zoomIn();

          return;
        }

        if (
          event.key === "-" ||
          event.code ===
            "NumpadSubtract"
        ) {
          event.preventDefault();

          zoomOut();

          return;
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown,
      true,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
        true,
      );
    };
  }, [
    previousPage,
    nextPage,
    zoomIn,
    zoomOut,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      ref={previewRef}
      className="document-preview"
    >
      <Document
        key={src}
        file={src}
        onLoadSuccess={
          handleLoadSuccess
        }
        onLoadError={
          handleLoadError
        }
        loading={
          <div className="document-loading">
            Membuka dokumen...
          </div>
        }
        error={
          <div className="document-error">
            Gagal membuka dokumen.
          </div>
        }
      >
        <div className="document-viewer">

          {/* SIDEBAR */}

          <aside
            ref={sidebarRef}
            className="document-sidebar"
          >
            <div className="document-thumbnails">
              {numPages > 0 &&
                Array.from(
                  {
                    length: numPages,
                  },
                  (_, index) => {
                    const pageNumber =
                      index + 1;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        className={
                          pageNumber ===
                          currentPage
                            ? "document-thumbnail active"
                            : "document-thumbnail"
                        }
                        onClick={() =>
                          selectPage(
                            pageNumber,
                          )
                        }
                      >
                        <div className="document-thumbnail-page">
                          <Page
                            pageNumber={
                              pageNumber
                            }
                            width={140}
                            renderTextLayer={
                              false
                            }
                            renderAnnotationLayer={
                              false
                            }
                          />
                        </div>

                        <span className="document-thumbnail-number">
                          {pageNumber}
                        </span>
                      </button>
                    );
                  },
                )}
            </div>
          </aside>

          {/* MAIN PDF */}

          <main className="document-main">
            <div
              ref={mainRef}
              className="document-page-scroll"
            >
              <div className="document-page-stage">
                <Page
                  key={`${currentPage}-${scale}`}
                  pageNumber={
                    currentPage
                  }
                  scale={scale}
                  renderTextLayer={
                    false
                  }
                  renderAnnotationLayer={
                    false
                  }
                  loading={
                    <div className="document-page-loading">
                      Memuat halaman...
                    </div>
                  }
                  error={
                    <div className="document-page-error">
                      Gagal memuat halaman.
                    </div>
                  }
                />
              </div>
            </div>

            {numPages > 0 && (
              <DocumentControls
                currentPage={
                  currentPage
                }
                numPages={numPages}
                scale={scale}
                onPreviousPage={
                  previousPage
                }
                onNextPage={
                  nextPage
                }
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onFit={fitPage}
              />
            )}
          </main>
        </div>
      </Document>

      {/* SAME FULLSCREEN BUTTON */}

      <FullscreenButton
        targetRef={previewRef}
      />
    </div>
  );
}

export default DocumentPreview;