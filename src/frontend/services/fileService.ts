import { invoke } from "@tauri-apps/api/core";

import type {
  FileCategory,
  FileMetadata,
} from "../types/file";


interface ScannedFileResponse {
  name: string;
  path: string;
  extension: string;
  category: FileCategory;
  size: number;
}


/* ============================================================
   SCAN
   ============================================================ */

export async function scanFolder(
  folderPath: string
): Promise<FileMetadata[]> {

  const files =
    await invoke<ScannedFileResponse[]>(
      "scan_folder",
      {
        folderPath,
      }
    );


  return files.map((file) => ({
    name: file.name,
    path: file.path,
    extension: file.extension,
    category: file.category,
    size: file.size,
  }));
}


/* ============================================================
   DELETE
   ============================================================ */

export async function deleteFile(
  filePath: string
): Promise<void> {

  await invoke(
    "delete_file",
    {
      filePath,
    }
  );
}


/* ============================================================
   MOVE
   ============================================================ */

export async function moveFile(
  filePath: string,
  destinationFolder: string
): Promise<string> {

  return await invoke<string>(
    "move_file",
    {
      filePath,
      destinationFolder,
    }
  );
}