import {
  useEffect,
  useRef,
} from "react";


import PreviewResolver from "../components/preview/PreviewResolver";

import ActionBar from "../components/sorting/ActionBar";

import FileInfo from "../components/sorting/FileInfo";

import SortingHeader from "../components/sorting/SortingHeader";

import SortingProgress from "../components/sorting/SortingProgress";


import useFitScale from "../hooks/useFitScale";


import type {
  FileMetadata,
} from "../types/file";


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
    file: SortingFile,
  ) => void;

  onMove?: (
    file: SortingFile,
  ) => void;

  onSave?: (
    file: SortingFile,
  ) => void;
}


function Sorting({
  folderName,
  files,
  currentIndex,
  onBack,
  onDelete,
  onMove,
  onSave,
}: SortingProps) {

  /*
   * =========================================================
   * CONTENT CANVAS
   * =========================================================
   *
   * Header tidak masuk canvas.
   *
   * Yang di-scale:
   *
   * - Progress
   * - Preview
   * - File info
   *
   * ActionBar tetap berada di canvas yang sama,
   * tetapi styling tombolnya berasal dari sorting.css.
   */

  const stageRef =
    useRef<HTMLDivElement>(
      null,
    );


  const {
    scale,
    width,
    height,
  } =
    useFitScale(
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
   * ACTIONS
   * =========================================================
   */

  const handleDelete =
    () => {

      if (!currentFile) {
        return;
      }


      onDelete?.(
        currentFile,
      );

    };


  const handleMove =
    () => {

      if (!currentFile) {
        return;
      }


      onMove?.(
        currentFile,
      );

    };


  const handleSave =
    () => {

      if (!currentFile) {
        return;
      }


      onSave?.(
        currentFile,
      );

    };


  /*
   * =========================================================
   * KEYBOARD SHORTCUTS
   * =========================================================
   */

  useEffect(() => {

    if (!currentFile) {
      return;
    }


    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {

        const target =
          event.target as
          HTMLElement | null;


        /*
         * Jangan jalankan shortcut ketika
         * user sedang mengetik.
         */

        if (
          target &&
          (
            target.tagName ===
              "INPUT" ||
            target.tagName ===
              "TEXTAREA" ||
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
          event.key.toLowerCase() ===
          "m"
        ) {

          event.preventDefault();

          handleMove();

          return;

        }


        /*
         * K = SAVE
         */

        if (
          event.key.toLowerCase() ===
          "k"
        ) {

          event.preventDefault();

          handleSave();

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
      <main className="sorting-page">

        <SortingHeader
          folderName={
            folderName
          }
          onBack={
            onBack
          }
        />


        <div
          className="sorting-empty"
        >

          <h2>
            Tidak ada file
          </h2>


          <p>
            Folder ini tidak
            memiliki file untuk
            disortir.
          </p>

        </div>


        <span className="sorting-version">
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
    <main className="sorting-page">


      {/* =====================================================
          HEADER
          
          FULL WIDTH WINDOW.
          TIDAK DI-SCALE.
      ===================================================== */}

      <SortingHeader
        folderName={
          folderName
        }
        onBack={
          onBack
        }
      />


      {/* =====================================================
          CONTENT VIEWPORT
          
          Berada tepat di bawah header.
          
          Gap header → progress diatur oleh
          padding-top pada sorting-fit.css.
      ===================================================== */}

      <div
        className="sorting-content-viewport"
      >


        {/* ===================================================
            SCALED CANVAS
        =================================================== */}

        <div
          className="sorting-stage-shell"
          style={{
            width:
              width || 1005,

            height:
              height || 650,
          }}
        >

          <div
            ref={stageRef}
            className="sorting-stage"
            style={{
              transform:
                `scale(${scale})`,
            }}
          >


            {/* ===============================================
                PROGRESS
            =============================================== */}

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


            {/* ===============================================
                PREVIEW
            =============================================== */}

            <section
              className="sorting-preview"
            >

              <PreviewResolver
                file={
                  currentFile
                }
              />

            </section>


            {/* ===============================================
                FILE INFO
            =============================================== */}

            <FileInfo
              file={
                currentFile
              }
            />


            {/* ===============================================
                ACTION BAR
            =============================================== */}

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


      {/* =====================================================
          VERSION
          
          FIXED KE WINDOW.
          TIDAK IKUT SCALE.
      ===================================================== */}

      <span className="sorting-version">
        Archio v1.0
      </span>


    </main>
  );
}


export default Sorting;