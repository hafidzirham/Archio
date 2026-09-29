import type { FileMetadata } from "../../types/file";

interface FileInfoProps {
  file: FileMetadata;
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024),
  );

  const safeIndex = Math.min(
    index,
    units.length - 1,
  );

  const value =
    bytes /
    Math.pow(1024, safeIndex);

  if (safeIndex === 0) {
    return `${Math.round(value)} ${units[safeIndex]}`;
  }

  return `${value.toFixed(1)} ${units[safeIndex]}`;
}

function formatExtension(
  extension: string,
): string {
  if (!extension) {
    return "FILE";
  }

  return extension
    .replace(".", "")
    .toUpperCase();
}

function formatDuration(
  seconds: number,
): string {
  if (!Number.isFinite(seconds)) {
    return "";
  }

  const totalSeconds =
    Math.max(0, Math.round(seconds));

  const hours = Math.floor(
    totalSeconds / 3600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );

  const remainingSeconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0",
    )}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function FileInfo({
  file,
}: FileInfoProps) {
  const extension =
    formatExtension(file.extension);

  const fileSize =
    formatFileSize(file.size);

  const metadata: string[] = [];

  /*
   * IMAGE
   * JPG · 4.5 MB · 4400 × 2130
   */
  if (
    file.category === "image" &&
    file.width &&
    file.height
  ) {
    metadata.push(
      `${file.width} × ${file.height}`,
    );
  }

  /*
   * VIDEO
   * MOV · 24.3 MB · 02:13
   */
  if (
    file.category === "video" &&
    file.duration !== undefined
  ) {
    const duration =
      formatDuration(file.duration);

    if (duration) {
      metadata.push(duration);
    }
  }

  /*
   * AUDIO
   * MP3 · 5.2 MB · 03:41
   */
  if (
    file.category === "audio" &&
    file.duration !== undefined
  ) {
    const duration =
      formatDuration(file.duration);

    if (duration) {
      metadata.push(duration);
    }
  }

  /*
   * DOCUMENT
   * PDF · 5 MB · 12 Halaman
   */
  if (
    file.category === "document" &&
    file.pageCount !== undefined
  ) {
    metadata.push(
      `${file.pageCount} Halaman`,
    );
  }

  /*
   * PRESENTATION
   * PPTX · 8.2 MB · 12 Slide
   */
  if (
    file.category ===
      "presentation" &&
    file.slideCount !== undefined
  ) {
    metadata.push(
      `${file.slideCount} Slide`,
    );
  }

  return (
    <section className="file-info">
      <h1
        className="file-info-name"
        title={file.name}
      >
        {file.name}
      </h1>

      <div className="file-info-details">
        <span className="file-info-item">
          {extension}
        </span>

        <span className="file-info-separator">
          ·
        </span>

        <span className="file-info-item">
          {fileSize}
        </span>

        {metadata.map(
          (item, index) => (
            <span
              key={`${item}-${index}`}
              className="file-info-metadata-group"
            >
              <span className="file-info-separator">
                ·
              </span>

              <span className="file-info-item">
                {item}
              </span>
            </span>
          ),
        )}
      </div>
    </section>
  );
}

export default FileInfo;