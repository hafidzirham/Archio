import { useState } from "react";

import Home from "./pages/Home";
import Sorting from "./pages/Sorting";

import {
  deleteFile,
  moveFile,
} from "./services/fileService";

import { pickFolder } from "./services/folderService";

import type { FileMetadata } from "./types/file";


interface SortingFile extends FileMetadata {
  previewSrc?: string;
}


type AppPage =
  | "home"
  | "sorting"
  | "complete";


function App() {

  const [currentPage, setCurrentPage] =
    useState<AppPage>("home");


  const [folderPath, setFolderPath] =
    useState("");


  const [files, setFiles] =
    useState<SortingFile[]>([]);


  const [currentIndex, setCurrentIndex] =
    useState(0);


  const [actionError, setActionError] =
    useState<string | null>(null);


  /* ========================================================
     START SORTING
     ======================================================== */

  const handleFolderSelected = (
    selectedFolderPath: string,
    scannedFiles: FileMetadata[]
  ) => {

    setFolderPath(
      selectedFolderPath
    );

    setFiles(
      scannedFiles
    );

    setCurrentIndex(0);

    setActionError(null);

    setCurrentPage("sorting");
  };


  /* ========================================================
     NEXT FILE
     ======================================================== */

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
            "complete"
          );

          return previousIndex;
        }


        return nextIndex;
      }
    );
  };


  /* ========================================================
     SAVE
     ======================================================== */

  const handleSave = (
    file: SortingFile
  ) => {

    setActionError(null);


    console.log(
      "[Archio] Saved:",
      file.path
    );


    /*
     * Simpan = file tetap berada di tempatnya.
     */

    goToNextFile();
  };


  /* ========================================================
     DELETE
     ======================================================== */

  const handleDelete = async (
    file: SortingFile
  ) => {

    try {

      setActionError(null);


      await deleteFile(
        file.path
      );


      console.log(
        "[Archio] Deleted:",
        file.path
      );


      goToNextFile();

    } catch (error) {

      console.error(
        "[Archio] Delete failed:",
        error
      );


      setActionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Gagal menghapus file."
      );
    }
  };


  /* ========================================================
     MOVE
     ======================================================== */

  const handleMove = async (
    file: SortingFile
  ) => {

    try {

      setActionError(null);


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
        destinationFolder
      );


      console.log(
        "[Archio] Moved:",
        file.path,
        "→",
        destinationFolder
      );


      goToNextFile();

    } catch (error) {

      console.error(
        "[Archio] Move failed:",
        error
      );


      setActionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Gagal memindahkan file."
      );
    }
  };


  /* ========================================================
     BACK TO HOME
     ======================================================== */

  const handleBack = () => {

    setCurrentPage("home");

    setFolderPath("");

    setFiles([]);

    setCurrentIndex(0);

    setActionError(null);
  };


  /* ========================================================
     COMPLETION
     ======================================================== */

  if (currentPage === "complete") {

    return (
      <main
        style={{
          width: "100%",
          minHeight: "100vh",

          display: "flex",
          flexDirection: "column",

          alignItems: "center",
          justifyContent: "center",

          gap: "10px",

          padding: "32px",

          boxSizing: "border-box",

          background: "#f5f6f8",

          fontFamily:
            "Urbanist, sans-serif",
        }}
      >

        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 600,
          }}
        >
          Folder selesai
        </h1>


        <p
          style={{
            margin: 0,
            color: "#777",
          }}
        >
          Semua file sudah diproses.
        </p>


        <button
          type="button"
          onClick={handleBack}
          style={{
            marginTop: "16px",

            padding:
              "11px 22px",

            border: "none",
            borderRadius: "8px",

            background: "#4c73e6",
            color: "#fff",

            fontFamily:
              "Urbanist, sans-serif",

            fontSize: "14px",
            fontWeight: 600,

            cursor: "pointer",
          }}
        >
          Kembali ke Home
        </button>

      </main>
    );
  }


  /* ========================================================
     SORTING
     ======================================================== */

  if (currentPage === "sorting") {

    const folderName =
      folderPath
        .split(/[\\/]/)
        .filter(Boolean)
        .pop() ||
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
          folderName={folderName}
          files={files}
          currentIndex={currentIndex}

          onBack={handleBack}

          onDelete={handleDelete}
          onMove={handleMove}
          onSave={handleSave}
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

              borderRadius: "8px",

              background:
                "#c0392b",

              color: "#fff",

              fontFamily:
                "Urbanist, sans-serif",

              fontSize: "13px",

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


  /* ========================================================
     HOME
     ======================================================== */

  return (
    <Home
      onFolderSelected={
        handleFolderSelected
      }
    />
  );
}


export default App;