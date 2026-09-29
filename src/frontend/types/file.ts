export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "unsupported";

export interface FileMetadata {
  /**
   * Nama file lengkap, termasuk extension.
   * Contoh: IMG_4122.JPG
   */
  name: string;

  /**
   * Path lengkap file di Windows.
   * Contoh:
   * D:\Downloads\IMG_4122.JPG
   */
  path: string;

  /**
   * Extension file dalam bentuk lowercase.
   * Contoh: ".jpg"
   */
  extension: string;

  /**
   * Kategori file.
   */
  category: FileCategory;

  /**
   * Ukuran file dalam bytes.
   */
  size: number;

  /**
   * Dimensi gambar/video.
   */
  width?: number;
  height?: number;

  /**
   * Durasi video/audio dalam detik.
   */
  duration?: number;

  /**
   * Jumlah halaman dokumen.
   */
  pageCount?: number;

  /**
   * Jumlah slide presentation.
   */
  slideCount?: number;
}