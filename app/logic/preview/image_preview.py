from PIL import Image, ImageTk
import tkinter as tk


def show_image(file_path, parent):
    """
    Menampilkan gambar di dalam parent.

    Args:
        file_path (str):
            Path file gambar.

        parent:
            Widget Tkinter/CustomTkinter tempat gambar ditampilkan.

    Returns:
        tk.Label:
            Widget gambar yang dibuat.
    """

    try:
        image = Image.open(file_path)

        # Ukuran maksimal area preview
        max_width = 750
        max_height = 500

        # Menjaga aspect ratio
        image.thumbnail(
            (max_width, max_height),
            Image.Resampling.LANCZOS
        )

        photo = ImageTk.PhotoImage(image)

        image_label = tk.Label(
            parent,
            image=photo,
            bg="#FFFFFF",
            bd=0
        )

        # Sangat penting!
        # Menyimpan reference agar image tidak hilang
        image_label.image = photo

        image_label.pack(
            expand=True
        )

        return image_label

    except Exception as error:

        error_label = tk.Label(
            parent,
            text=f"Gagal menampilkan gambar:\n{error}",
            font=("Arial", 14),
            fg="#DC2626",
            bg="#FFFFFF"
        )

        error_label.pack(
            expand=True
        )

        return error_label