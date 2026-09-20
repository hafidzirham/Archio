def preview_text(file_path):
    """
    Membaca file text atau source code
    untuk kebutuhan preview.

    Args:
        file_path (str):
            Path file.

    Returns:
        str:
            Isi file.
    """

    try:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            return file.read()

    except UnicodeDecodeError:

        return "File menggunakan encoding yang tidak didukung."

    except OSError:

        return "File tidak dapat dibaca."