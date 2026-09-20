from app.logic.file_classifier import classify_file

from app.logic.preview.image_preview import show_image
from app.logic.preview.video_preview import VideoPlayer


def show_preview(file_path, parent):

    file_type = classify_file(
        file_path
    )

    # =================================================
    # IMAGE
    # =================================================

    if file_type == "image":

        return show_image(
            file_path,
            parent
        )


    # =================================================
    # VIDEO
    # =================================================

    if file_type == "video":

        return VideoPlayer(
            file_path,
            parent
        )


    # =================================================
    # OTHER FILES
    # =================================================

    message = {
        "audio": "Preview audio belum tersedia.",
        "text": "Preview text belum tersedia.",
        "code": "Preview code belum tersedia.",
        "pdf": "Preview PDF belum tersedia.",
        "document": "Preview document belum tersedia.",
        "spreadsheet": "Preview spreadsheet belum tersedia.",
        "presentation": "Preview presentation belum tersedia.",
        "archive": "File archive tidak memiliki preview.",
        "executable": "File executable tidak memiliki preview.",
        "font": "Preview font belum tersedia.",
        "unknown": "Format file tidak didukung."
    }

    return show_message(
        message.get(
            file_type,
            "Preview tidak tersedia."
        ),
        parent
    )


def show_message(message, parent):

    import tkinter as tk

    label = tk.Label(
        parent,
        text=message,
        font=("Arial", 15),
        fg="#777777",
        bg="#FFFFFF"
    )

    label.pack(
        expand=True
    )

    return label