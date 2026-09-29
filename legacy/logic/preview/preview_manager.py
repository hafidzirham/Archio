import os

from app.logic.file_classifier import classify_file

from app.logic.preview.image_preview import show_image
from app.logic.preview.video_preview import VideoPlayer
from app.logic.preview.text_preview import show_text
from app.logic.preview.pdf_preview import show_pdf
from app.logic.preview.document_preview import show_document
from app.logic.preview.svg_preview import show_svg
from app.logic.preview.eps_preview import show_eps
from app.logic.preview.ai_preview import show_ai


def show_preview(file_path, parent):
    file_type = classify_file(file_path)

    if file_type == "image":
        return show_image(
            file_path,
            parent
        )

    if file_type == "video":
        return VideoPlayer(
            file_path,
            parent
        )

    if file_type == "text":
        return show_text(
            file_path,
            parent
        )

    if file_type == "pdf":
        return show_pdf(
            file_path,
            parent
        )

    if file_type == "document":
        return show_document(
            file_path,
            parent
        )

    if file_type == "svg":
        return show_svg(
            file_path, parent
        )

    if file_type == "eps":
        return show_eps(
            file_path, parent
        )

    if file_type == "ai":
        return show_ai(
            file_path, parent
        )

    return show_unsupported_message(
        file_path,
        parent
    )

    # =====================================================
    # IMAGE
    # =====================================================

    if file_type == "image":

        return show_image(
            file_path,
            parent
        )

    # =====================================================
    # VIDEO
    # =====================================================

    if file_type == "video":

        return VideoPlayer(
            file_path,
            parent
        )

    # =====================================================
    # TEXT
    # =====================================================

    if file_type == "text":

        return show_text(
            file_path,
            parent
        )

    # =====================================================
    # PDF
    # =====================================================

    if file_type == "pdf":

        return show_pdf(
            file_path,
            parent
        )

    # =====================================================
    # DOCUMENT
    # =====================================================

    if file_type == "document":

        return show_document(
            file_path,
            parent
        )

    # =====================================================
    # AUDIO
    # =====================================================

    if file_type == "audio":

        return show_message(
            title="Preview Audio Belum Tersedia",
            filename=filename,
            extension=extension,
            description=(
                "File ini dikenali sebagai file audio, "
                "tetapi fitur preview audio belum tersedia."
            ),
            parent=parent
        )

    # =====================================================
    # CODE
    # =====================================================

    if file_type == "code":

        return show_message(
            title="Preview Code Belum Tersedia",
            filename=filename,
            extension=extension,
            description=(
                "File ini dikenali sebagai file kode, "
                "tetapi fitur preview code belum tersedia."
            ),
            parent=parent
        )

    # =====================================================
    # SPREADSHEET
    # =====================================================

    if file_type == "spreadsheet":

        return show_message(
            title="Preview Spreadsheet Belum Tersedia",
            filename=filename,
            extension=extension,
            description=(
                "File spreadsheet dikenali oleh File Shorter, "
                "tetapi fitur preview spreadsheet belum tersedia."
            ),
            parent=parent
        )

    # =====================================================
    # PRESENTATION
    # =====================================================

    if file_type == "presentation":

        return show_message(
            title="Preview Presentasi Belum Tersedia",
            filename=filename,
            extension=extension,
            description=(
                "File presentasi dikenali oleh File Shorter, "
                "tetapi fitur preview presentasi belum tersedia."
            ),
            parent=parent
        )

    # =====================================================
    # ARCHIVE
    # =====================================================

    if file_type == "archive":

        return show_message(
            title="Preview Archive Tidak Tersedia",
            filename=filename,
            extension=extension,
            description=(
                "File archive tidak dapat ditampilkan "
                "secara langsung sebagai preview."
            ),
            parent=parent
        )

    # =====================================================
    # EXECUTABLE
    # =====================================================

    if file_type == "executable":

        return show_message(
            title="Preview Executable Tidak Tersedia",
            filename=filename,
            extension=extension,
            description=(
                "File executable tidak dapat ditampilkan "
                "sebagai preview."
            ),
            parent=parent
        )

    # =====================================================
    # FONT
    # =====================================================

    if file_type == "font":

        return show_message(
            title="Preview Font Belum Tersedia",
            filename=filename,
            extension=extension,
            description=(
                "File font dikenali oleh File Shorter, "
                "tetapi fitur preview font belum tersedia."
            ),
            parent=parent
        )

    # =====================================================
    # UNKNOWN
    # =====================================================

    return show_unsupported_message(
        filename=filename,
        extension=extension,
        parent=parent
    )


# =========================================================
# MESSAGE
# =========================================================

def show_message(
    title,
    filename,
    extension,
    description,
    parent
):

    import tkinter as tk

    container = tk.Frame(
        parent,
        bg="#FFFFFF"
    )

    container.place(
        relx=0.5,
        rely=0.5,
        anchor="center"
    )

    icon_label = tk.Label(
        container,
        text="!",
        font=("Arial", 42, "bold"),
        fg="#F59E0B",
        bg="#FFFFFF"
    )

    icon_label.pack(
        pady=(0, 8)
    )

    title_label = tk.Label(
        container,
        text=title,
        font=("Arial", 18, "bold"),
        fg="#222222",
        bg="#FFFFFF"
    )

    title_label.pack()

    filename_label = tk.Label(
        container,
        text=filename,
        font=("Arial", 14, "bold"),
        fg="#444444",
        bg="#FFFFFF",
        wraplength=600
    )

    filename_label.pack(
        pady=(10, 2)
    )

    extension_label = tk.Label(
        container,
        text=f"Format: {extension}",
        font=("Arial", 13),
        fg="#666666",
        bg="#FFFFFF"
    )

    extension_label.pack(
        pady=(0, 8)
    )

    description_label = tk.Label(
        container,
        text=description,
        font=("Arial", 13),
        fg="#777777",
        bg="#FFFFFF",
        justify="center",
        wraplength=600
    )

    description_label.pack()

    return container


# =========================================================
# UNSUPPORTED
# =========================================================

def show_unsupported_message(
    filename,
    extension,
    parent
):

    import tkinter as tk

    container = tk.Frame(
        parent,
        bg="#FFFFFF"
    )

    container.place(
        relx=0.5,
        rely=0.5,
        anchor="center"
    )

    icon_label = tk.Label(
        container,
        text="?",
        font=("Arial", 42, "bold"),
        fg="#DC2626",
        bg="#FFFFFF"
    )

    icon_label.pack(
        pady=(0, 8)
    )

    title_label = tk.Label(
        container,
        text="Format File Tidak Didukung",
        font=("Arial", 18, "bold"),
        fg="#222222",
        bg="#FFFFFF"
    )

    title_label.pack()

    filename_label = tk.Label(
        container,
        text=filename,
        font=("Arial", 14, "bold"),
        fg="#444444",
        bg="#FFFFFF",
        wraplength=600
    )

    filename_label.pack(
        pady=(10, 2)
    )

    extension_label = tk.Label(
        container,
        text=f"Format: {extension}",
        font=("Arial", 13),
        fg="#DC2626",
        bg="#FFFFFF"
    )

    extension_label.pack(
        pady=(0, 8)
    )

    description_label = tk.Label(
        container,
        text=(
            "Format file ini belum dikenali oleh "
            "File Shorter sehingga preview tidak "
            "dapat ditampilkan."
        ),
        font=("Arial", 13),
        fg="#777777",
        bg="#FFFFFF",
        justify="center",
        wraplength=600
    )

    description_label.pack()

    return container