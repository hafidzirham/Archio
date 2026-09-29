from pathlib import Path


# =========================================================
# FILE EXTENSIONS
# =========================================================

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tiff",
    ".tif",
    ".ico",
}

VIDEO_EXTENSIONS = {
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".m4v",
    ".3gp",
}

AUDIO_EXTENSIONS = {
    ".mp3",
    ".wav",
    ".flac",
    ".aac",
    ".ogg",
    ".m4a",
    ".wma",
}

TEXT_EXTENSIONS = {
    ".txt",
    ".md",
    ".log",
    ".csv",
    ".json",
    ".xml",
    ".yaml",
    ".yml",
    ".ini",
    ".cfg",
    ".conf",
}

CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".php",
    ".java",
    ".c",
    ".h",
    ".cpp",
    ".hpp",
    ".cs",
    ".go",
    ".rs",
    ".swift",
    ".kt",
    ".sql",
    ".sh",
    ".bat",
    ".ps1",
}

PDF_EXTENSIONS = {
    ".pdf",
}

DOCUMENT_EXTENSIONS = {
    ".doc",
    ".docx",
    ".odt",
    ".rtf",
}

SPREADSHEET_EXTENSIONS = {
    ".xls",
    ".xlsx",
    ".ods",
}

PRESENTATION_EXTENSIONS = {
    ".ppt",
    ".pptx",
    ".odp",
}

ARCHIVE_EXTENSIONS = {
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
}

EXECUTABLE_EXTENSIONS = {
    ".exe",
    ".msi",
    ".com",
    ".scr",
}

FONT_EXTENSIONS = {
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
}

# =========================================================
# VECTOR / DESIGN FILES
# =========================================================

SVG_EXTENSIONS = {
    ".svg",
}

EPS_EXTENSIONS = {
    ".eps",
}

AI_EXTENSIONS = {
    ".ai",
}


# =========================================================
# CLASSIFICATION
# =========================================================

def classify_file(file_path):
    """
    Menentukan kategori file berdasarkan ekstensi.

    Args:
        file_path (str):
            Path file.

    Returns:
        str:
            Kategori file.
    """

    extension = Path(
        file_path
    ).suffix.lower()

    # =====================================================
    # VECTOR / DESIGN
    #
    # Diletakkan sebelum IMAGE_EXTENSIONS supaya
    # SVG tidak dianggap sebagai image biasa.
    # =====================================================

    if extension in SVG_EXTENSIONS:
        return "svg"

    if extension in EPS_EXTENSIONS:
        return "eps"

    if extension in AI_EXTENSIONS:
        return "ai"

    # =====================================================
    # IMAGE
    # =====================================================

    if extension in IMAGE_EXTENSIONS:
        return "image"

    # =====================================================
    # VIDEO
    # =====================================================

    if extension in VIDEO_EXTENSIONS:
        return "video"

    # =====================================================
    # AUDIO
    # =====================================================

    if extension in AUDIO_EXTENSIONS:
        return "audio"

    # =====================================================
    # TEXT
    # =====================================================

    if extension in TEXT_EXTENSIONS:
        return "text"

    # =====================================================
    # CODE
    # =====================================================

    if extension in CODE_EXTENSIONS:
        return "code"

    # =====================================================
    # PDF
    # =====================================================

    if extension in PDF_EXTENSIONS:
        return "pdf"

    # =====================================================
    # DOCUMENT
    # =====================================================

    if extension in DOCUMENT_EXTENSIONS:
        return "document"

    # =====================================================
    # SPREADSHEET
    # =====================================================

    if extension in SPREADSHEET_EXTENSIONS:
        return "spreadsheet"

    # =====================================================
    # PRESENTATION
    # =====================================================

    if extension in PRESENTATION_EXTENSIONS:
        return "presentation"

    # =====================================================
    # ARCHIVE
    # =====================================================

    if extension in ARCHIVE_EXTENSIONS:
        return "archive"

    # =====================================================
    # EXECUTABLE
    # =====================================================

    if extension in EXECUTABLE_EXTENSIONS:
        return "executable"

    # =====================================================
    # FONT
    # =====================================================

    if extension in FONT_EXTENSIONS:
        return "font"

    # =====================================================
    # UNKNOWN
    # =====================================================

    return "unknown"