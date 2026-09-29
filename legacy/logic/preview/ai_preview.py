from PIL import Image

from app.logic.preview.vector_preview import VectorPreview


def render_ai(file_path):

    # =========================================================
    # METHOD 1
    # PyMuPDF
    #
    # Banyak file AI Adobe Illustrator memiliki PDF
    # compatibility sehingga bisa dirender seperti PDF.
    # =========================================================

    try:

        import fitz

        document = fitz.open(
            file_path
        )

        if document.page_count <= 0:

            document.close()

            raise Exception(
                "File AI tidak memiliki halaman."
            )

        page = document.load_page(
            0
        )

        # =====================================================
        # RESOLUTION
        #
        # 2x supaya zoom 200% masih cukup bagus.
        # =====================================================

        matrix = fitz.Matrix(
            2.0,
            2.0
        )

        pixmap = page.get_pixmap(
            matrix=matrix,
            alpha=True
        )

        image = Image.frombytes(
            "RGBA",
            (
                pixmap.width,
                pixmap.height
            ),
            pixmap.samples
        )

        document.close()

        return image.copy()

    except Exception as first_error:

        # =====================================================
        # METHOD 2
        # Pillow fallback
        # =====================================================

        try:

            image = Image.open(
                file_path
            )

            image.load()

            if image.mode not in (
                "RGB",
                "RGBA"
            ):

                image = image.convert(
                    "RGBA"
                )

            return image.copy()

        except Exception as second_error:

            raise Exception(
                "Gagal merender file AI.\n\n"
                f"PyMuPDF: {first_error}\n\n"
                f"Pillow: {second_error}"
            )


def show_ai(
    file_path,
    parent
):

    return VectorPreview(
        file_path=file_path,
        parent=parent,
        render_function=render_ai,
        file_type="ai"
    )