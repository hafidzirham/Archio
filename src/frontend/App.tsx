import {
  useEffect,
  useState,
} from "react";

import Home from "./pages/Home";
import Sorting from "./pages/Sorting";

import {
  deleteFile,
  moveFile,
} from "./services/fileService";

import {
  pickFolder,
} from "./services/folderService";

import ThemeToggle from "./components/sorting/ThemeToggle";

import type {
  FileMetadata,
} from "./types/file";


interface SortingFile
  extends FileMetadata {
  previewSrc?: string;
}


type AppPage =
  | "home"
  | "sorting"
  | "complete";


export type Theme =
  | "light"
  | "dark";


function getInitialTheme(): Theme {

  try {

    const savedTheme =
      localStorage.getItem(
        "archio-theme",
      );


    if (
      savedTheme === "dark"
    ) {

      return "dark";

    }


    return "light";

  } catch {

    return "light";

  }
}


function applyTheme(
  theme: Theme,
) {

  const root =
    document.documentElement;

  const body =
    document.body;


  root.dataset.theme =
    theme;

  body.dataset.theme =
    theme;

  root.style.colorScheme =
    theme;

}


function App() {

  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  const [
    currentPage,
    setCurrentPage,
  ] = useState<AppPage>(
    "home",
  );


  /*
   * ========================================================
   * THEME
   * ========================================================
   */

  const [
    theme,
    setTheme,
  ] = useState<Theme>(
    getInitialTheme,
  );


  /*
   * ========================================================
   * APPLY THEME
   * ========================================================
   */

  useEffect(() => {

    applyTheme(
      theme,
    );


    try {

      localStorage.setItem(
        "archio-theme",
        theme,
      );

    } catch {
      // Ignore localStorage errors.
    }

  }, [
    theme,
  ]);


  /*
   * ========================================================
   * SYNC THEME
   * ========================================================
   *
   * Home mempunyai ThemeToggle tanpa props.
   * Jika toggle tersebut mengubah data-theme langsung,
   * App akan ikut mengetahui perubahan tersebut.
   */

  useEffect(() => {

    const root =
      document.documentElement;


    const observer =
      new MutationObserver(
        () => {

          const domTheme =
            root.dataset.theme;


          if (
            domTheme === "dark"
            ||
            domTheme === "light"
          ) {

            setTheme(
              (previousTheme) =>
                previousTheme === domTheme
                  ? previousTheme
                  : domTheme,
            );

          }

        },
      );


    observer.observe(
      root,
      {
        attributes: true,

        attributeFilter: [
          "data-theme",
        ],
      },
    );


    return () => {

      observer.disconnect();

    };

  }, []);


  /*
   * ========================================================
   * THEME TOGGLE
   * ========================================================
   */

  const handleThemeToggle =
    () => {

      setTheme(
        (previousTheme) =>
          previousTheme === "dark"
            ? "light"
            : "dark",
      );

    };


  /*
   * ========================================================
   * FOLDER
   * ========================================================
   */

  const [
    folderPath,
    setFolderPath,
  ] = useState("");


  /*
   * ========================================================
   * FILES
   * ========================================================
   */

  const [
    files,
    setFiles,
  ] = useState<SortingFile[]>(
    [],
  );


  /*
   * ========================================================
   * CURRENT FILE
   * ========================================================
   */

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);


  /*
   * ========================================================
   * ERROR
   * ========================================================
   */

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );


  /*
   * ========================================================
   * START SORTING
   * ========================================================
   */

  const handleFolderSelected = (
    selectedFolderPath: string,
    scannedFiles: FileMetadata[],
  ) => {

    setFolderPath(
      selectedFolderPath,
    );


    setFiles(
      scannedFiles,
    );


    setCurrentIndex(
      0,
    );


    setActionError(
      null,
    );


    setCurrentPage(
      "sorting",
    );

  };


  /*
   * ========================================================
   * NEXT FILE
   * ========================================================
   */

  const goToNextFile = () => {

    setCurrentIndex(
      (previousIndex) => {

        const nextIndex =
          previousIndex + 1;


        if (
          nextIndex >=
          files.length
        ) {

          setCurrentPage(
            "complete",
          );


          return previousIndex;

        }


        return nextIndex;

      },
    );

  };


  /*
   * ========================================================
   * SAVE
   * ========================================================
   */

  const handleSave = (
    file: SortingFile,
  ) => {

    setActionError(
      null,
    );


    console.log(
      "[Archio] Saved:",
      file.path,
    );


    /*
     * Simpan = file tetap berada
     * di tempatnya.
     */

    goToNextFile();

  };


  /*
   * ========================================================
   * DELETE
   * ========================================================
   */

  const handleDelete = async (
    file: SortingFile,
  ) => {

    try {

      setActionError(
        null,
      );


      await deleteFile(
        file.path,
      );


      console.log(
        "[Archio] Deleted:",
        file.path,
      );


      goToNextFile();

    } catch (error) {

      console.error(
        "[Archio] Delete failed:",
        error,
      );


      setActionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Gagal menghapus file.",
      );

    }

  };


  /*
   * ========================================================
   * MOVE
   * ========================================================
   */

  const handleMove = async (
    file: SortingFile,
  ) => {

    try {

      setActionError(
        null,
      );


      const destinationFolder =
        await pickFolder();


      /*
       * User membatalkan picker.
       */

      if (!destinationFolder) {

        return;

      }


      await moveFile(
        file.path,
        destinationFolder,
      );


      console.log(
        "[Archio] Moved:",
        file.path,
        "→",
        destinationFolder,
      );


      goToNextFile();

    } catch (error) {

      console.error(
        "[Archio] Move failed:",
        error,
      );


      setActionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Gagal memindahkan file.",
      );

    }

  };


  /*
   * ========================================================
   * BACK TO HOME
   * ========================================================
   */

  const handleBack = () => {

    setCurrentPage(
      "home",
    );


    setFolderPath(
      "",
    );


    setFiles(
      [],
    );


    setCurrentIndex(
      0,
    );


    setActionError(
      null,
    );

  };


  /*
   * ========================================================
   * COMPLETION
   * ========================================================
   */

  if (
    currentPage ===
    "complete"
  ) {

    return (
      <main
        className="completion-page"
      >

        <div
          className="completion-theme-toggle"
        >

          <ThemeToggle
            theme={theme}
            onToggle={
              handleThemeToggle
            }
          />

        </div>


        <section
          className="completion-card"
        >

          <div
            className="completion-icon"
            aria-hidden="true"
          >

            <svg
              viewBox="0 0 48 48"
              fill="none"
            >

              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="currentColor"
                strokeWidth="2"
              />

              <path
                d="M14 24.5L20.5 31L34 17"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

            </svg>

          </div>


          <h1
            className="completion-title"
          >
            Folder selesai
          </h1>


          <p
            className="completion-description"
          >
            Semua file sudah diproses.
          </p>


          <button
            type="button"
            className="completion-button"
            onClick={
              handleBack
            }
          >

            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >

              <path
                d="M19 12H5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M10 7L5 12L10 17"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

            </svg>


            <span>
              Kembali ke Home
            </span>

          </button>

        </section>


        <span
          className="completion-version"
        >
          Archio v1.0
        </span>

      </main>
    );

  }


  /*
   * ========================================================
   * SORTING
   * ========================================================
   */

  if (
    currentPage ===
    "sorting"
  ) {

    const folderName =
      folderPath
        .split(/[\\/]/)
        .filter(Boolean)
        .pop()
      ||
      folderPath;


    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
        }}
      >

        <Sorting
          folderName={
            folderName
          }

          files={
            files
          }

          currentIndex={
            currentIndex
          }

          onBack={
            handleBack
          }

          onDelete={
            handleDelete
          }

          onMove={
            handleMove
          }

          onSave={
            handleSave
          }

          theme={
            theme
          }

          onThemeToggle={
            handleThemeToggle
          }
        />


        {actionError && (
          <div
            style={{
              position: "fixed",

              left: "50%",
              bottom: "24px",

              transform:
                "translateX(-50%)",

              zIndex: 1000,

              maxWidth:
                "min(90vw, 520px)",

              padding:
                "10px 16px",

              borderRadius:
                "8px",

              background:
                "#c0392b",

              color:
                "#fff",

              fontFamily:
                "Urbanist, sans-serif",

              fontSize:
                "13px",

              boxShadow:
                "0 6px 20px rgba(0,0,0,0.15)",
            }}
          >

            {actionError}

          </div>
        )}

      </div>
    );

  }


  /*
   * ========================================================
   * HOME
   * ========================================================
   */

  return (
    <Home
      onFolderSelected={
        handleFolderSelected
      }
    />
  );

}


export default App;