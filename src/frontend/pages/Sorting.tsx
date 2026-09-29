import {
  useEffect,
  useRef,
} from "react";

import PreviewResolver
  from "../components/preview/PreviewResolver";

import ActionBar
  from "../components/sorting/ActionBar";

import FileInfo
  from "../components/sorting/FileInfo";

import SortingHeader
  from "../components/sorting/SortingHeader";

import SortingProgress
  from "../components/sorting/SortingProgress";

import useFitScale
  from "../hooks/useFitScale";

import {
  preloadPresentation,
} from "../services/presentationService";

import {
  preloadVectorPreview,
} from "../services/vectorService";

import type {
  FileMetadata,
} from "../types/file";

import type {
  Theme,
} from "../components/sorting/ThemeToggle";

import "../styles/sorting.css";
import "../styles/sorting-fit.css";


interface SortingFile
  extends FileMetadata {
  previewSrc?: string;
}


interface SortingProps {
  folderName: string;

  files: SortingFile[];

  currentIndex: number;

  onBack?: () => void;

  onDelete?: (
    file: SortingFile
  ) => void;

  onMove?: (
    file: SortingFile
  ) => void;

  onSave?: (
    file: SortingFile
  ) => void;

  theme: Theme;

  onThemeToggle: () => void;
}


function Sorting({
  folderName,
  files,
  currentIndex,
  onBack,
  onDelete,
  onMove,
  onSave,
  theme,
  onThemeToggle,
}: SortingProps) {

  const stageRef =
    useRef<HTMLDivElement>(
      null
    );


  const {
    scale,
    width,
    height,
  } = useFitScale(
    stageRef,
    {
      horizontalPadding: 24,
      verticalPadding: 16,
    },
  );


  const currentFile =
    files[currentIndex];


  /*
   * =========================================================
   * PRELOAD NEXT FILE
   * =========================================================
   *
   * Hanya file yang menggunakan renderer berat yang diproses.
   *
   * JPG / PNG / MP4 / PDF biasa tidak dipreload di sini.
   *
   * Presentation:
   *   render slide pertama.
   *
   * AI / EPS / PS / PSD / PSB:
   *   render preview vector.
   *
   * Delay 700ms memberi prioritas kepada preview file
   * yang sedang aktif.
   */

  useEffect(() => {

    const nextFile =
      files[currentIndex + 1];


    if (!nextFile) {
      return;
    }


    const timer =
      window.setTimeout(
        () => {

          const extension =
            nextFile.extension
              .toLowerCase();


          /*
           * VECTOR
           */

          const isVector =
            nextFile.category ===
              "image"
            &&
            (
              extension === ".ai"
              ||
              extension === ".eps"
              ||
              extension === ".ps"
              ||
              extension === ".psd"
              ||
              extension === ".psb"
            );


          if (isVector) {

            preloadVectorPreview(
              nextFile.path
            );

            return;
          }


          /*
           * PRESENTATION
           */

          if (
            nextFile.category ===
            "presentation"
          ) {

            preloadPresentation(
              nextFile.path,
              0,
            );
          }

        },
        700,
      );


    return () => {

      window.clearTimeout(
        timer
      );

    };

  }, [
    files,
    currentIndex,
  ]);


  /*
   * =========================================================
   * ACTIONS
   * =========================================================
   */

  const handleDelete =
    () => {

      if (!currentFile) {
        return;
      }

      onDelete?.(
        currentFile
      );
    };


  const handleMove =
    () => {

      if (!currentFile) {
        return;
      }

      onMove?.(
        currentFile
      );
    };


  const handleSave =
    () => {

      if (!currentFile) {
        return;
      }

      onSave?.(
        currentFile
      );
    };


  /*
   * =========================================================
   * KEYBOARD SHORTCUTS
   * =========================================================
   *
   * DELETE = Hapus
   * M      = Pindah
   * K      = Simpan
   */

  useEffect(() => {

    if (!currentFile) {
      return;
    }


    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {

        const target =
          event.target as
          HTMLElement | null;


        /*
         * Jangan jalankan shortcut ketika user sedang
         * mengetik pada input / textarea.
         */

        if (
          target
          &&
          (
            target.tagName ===
              "INPUT"
            ||
            target.tagName ===
              "TEXTAREA"
            ||
            target.isContentEditable
          )
        ) {

          return;
        }


        /*
         * DELETE
         */

        if (
          event.key ===
          "Delete"
        ) {

          event.preventDefault();

          handleDelete();

          return;
        }


        /*
         * M = MOVE
         */

        if (
          event.key.toLowerCase()
          === "m"
        ) {

          event.preventDefault();

          handleMove();

          return;
        }


        /*
         * K = SAVE
         */

        if (
          event.key.toLowerCase()
          === "k"
        ) {

          event.preventDefault();

          handleSave();

          return;
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
    currentFile,
  ]);


  /*
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */

  if (!currentFile) {

    return (
      <main
        className="sorting-page"
      >

        <SortingHeader
          folderName={
            folderName
          }

          onBack={
            onBack
          }

          theme={
            theme
          }

          onThemeToggle={
            onThemeToggle
          }
        />


        <div
          className="sorting-empty"
        >

          <h2>
            Tidak ada file
          </h2>


          <p>
            Folder ini tidak memiliki
            file untuk disortir.
          </p>

        </div>


        <span
          className="sorting-version"
        >
          Archio v1.0
        </span>

      </main>
    );
  }


  /*
   * =========================================================
   * PROGRESS
   * =========================================================
   */

  const totalFiles =
    files.length;


  const currentFileNumber =
    currentIndex + 1;


  const remainingFiles =
    Math.max(
      0,
      totalFiles -
        currentFileNumber,
    );


  /*
   * =========================================================
   * MAIN
   * =========================================================
   */

  return (
    <main
      className="sorting-page"
    >

      <SortingHeader
        folderName={
          folderName
        }

        onBack={
          onBack
        }

        theme={
          theme
        }

        onThemeToggle={
          onThemeToggle
        }
      />


      <div
        className=
          "sorting-content-viewport"
      >

        <div
          className=
            "sorting-stage-shell"
          style={{
            width:
              width || 1005,

            height:
              height || 650,
          }}
        >

          <div
            ref={stageRef}
            className=
              "sorting-stage"
            style={{
              transform:
                `scale(${scale})`,
            }}
          >

            <SortingProgress
              current={
                currentFileNumber
              }

              total={
                totalFiles
              }

              remaining={
                remainingFiles
              }
            />


            <section
              className=
                "sorting-preview"
            >

              <PreviewResolver
                file={
                  currentFile
                }
              />

            </section>


            <FileInfo
              file={
                currentFile
              }
            />


            {/*
             * ACTION BAR SENGAJA TIDAK DIUBAH
             */}

            <ActionBar
              onDelete={
                handleDelete
              }

              onMove={
                handleMove
              }

              onSave={
                handleSave
              }
            />

          </div>

        </div>

      </div>


      <span
        className=
          "sorting-version"
      >
        Archio v1.0
      </span>

    </main>
  );
}


export default Sorting;