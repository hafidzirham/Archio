import {
  useRef,
  useState,
} from "react";

import {
  pickFolder,
} from "../services/folderService";

import {
  scanFolder,
} from "../services/fileService";

import type {
  FileMetadata,
} from "../types/file";

import useFitScale from "../hooks/useFitScale";

import ThemeToggle from "../components/sorting/ThemeToggle";

import "../styles/home.css";
import "../styles/home-fit.css";


interface HomeProps {
  onFolderSelected: (
    folderPath: string,
    files: FileMetadata[],
  ) => void;
}


function Home({
  onFolderSelected,
}: HomeProps) {

  const stageRef =
    useRef<HTMLDivElement>(null);


  const {
    scale,
    width,
    height,
  } = useFitScale(
    stageRef,
  );


  const [
    isScanning,
    setIsScanning,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  const handlePickFolder =
    async () => {

      try {

        setError(null);


        const folderPath =
          await pickFolder();


        if (!folderPath) {
          return;
        }


        setIsScanning(true);


        console.log(
          "[Archio] Folder dipilih:",
          folderPath,
        );


        const files =
          await scanFolder(
            folderPath,
          );


        console.log(
          "[Archio] File ditemukan:",
          files.length,
        );


        if (
          files.length === 0
        ) {

          setError(
            "Folder ini tidak memiliki file.",
          );

          return;
        }


        onFolderSelected(
          folderPath,
          files,
        );

      } catch (error) {

        console.error(
          "[Archio] Gagal membaca folder:",
          error,
        );


        const errorMessage =
          typeof error ===
          "string"

            ? error

            : error instanceof
              Error

              ? error.message

              : JSON.stringify(
                  error,
                );


        setError(
          errorMessage ||
          "Gagal membaca folder.",
        );

      } finally {

        setIsScanning(false);

      }
    };


  return (
    <main className="home">

      {/* =====================================================
          THEME TOGGLE
      ===================================================== */}

      <div className="home-theme-toggle">
        <ThemeToggle />
      </div>


      {/* =====================================================
          HOME CONTENT
      ===================================================== */}

      <div
        className="home-stage-shell"
        style={{
          width:
            width || 520,

          height:
            height || 620,
        }}
      >

        <div
          ref={stageRef}
          className="home-stage"
          style={{
            transform:
              `scale(${scale})`,
          }}
        >

          <div className="home-content">

            <img
              className="home-illustration"
              src="/assets/images/home-illustration.png"
              alt="Archio folder organization"
            />


            <h1 className="home-title">
              Archio
            </h1>


            <p className="home-subtitle">
              Atur folder kamu dengan mudah.
            </p>


            <button
              type="button"
              className="select-folder-button"
              onClick={
                handlePickFolder
              }
              disabled={
                isScanning
              }
            >
              {isScanning
                ? "Memindai..."
                : "Pilih Folder"}
            </button>


            {error && (
              <p className="home-error">
                {error}
              </p>
            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          VERSION
      ===================================================== */}

      <span className="app-version">
        Archio v1.0
      </span>

    </main>
  );
}


export default Home;