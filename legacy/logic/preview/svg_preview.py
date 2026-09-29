import io

from PIL import Image

from app.logic.preview.vector_preview import VectorPreview


def render_svg(file_path):

    try:
        from svglib.svglib import svg2rlg
        from reportlab.graphics import renderPDF
        import fitz

    except ImportError as error:

        raise Exception(
            "Library SVG belum lengkap.\n\n"
            "Install dengan:\n"
            "pip install svglib reportlab PyMuPDF"
        ) from error

    drawing = None
    pdf_buffer = None
    document = None

    try:

        # =====================================================
        # READ SVG
        # =====================================================

        drawing = svg2rlg(
            file_path
        )

        if drawing is None:

            raise Exception(
                "SVG tidak dapat dibaca."
            )

        # =====================================================
        # RENDER SVG -> PDF
        # =====================================================

        pdf_buffer = io.BytesIO()

        renderPDF.drawToFile(
            drawing,
            pdf_buffer
        )

        pdf_buffer.seek(0)

        # =====================================================
        # PDF -> IMAGE
        # =====================================================

        document = fitz.open(
            stream=pdf_buffer.getvalue(),
            filetype="pdf"
        )

        if document.page_count == 0:

            raise Exception(
                "SVG tidak memiliki halaman."
            )

        page = document.load_page(
            0
        )

        # =====================================================
        # RENDER HIGH RESOLUTION
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

        return image.copy()

    except Exception as error:

        raise Exception(
            f"Gagal merender SVG:\n{error}"
        )

    finally:

        if document is not None:

            try:
                document.close()
            except Exception:
                pass

        if pdf_buffer is not None:

            try:
                pdf_buffer.close()
            except Exception:
                pass


def show_svg(
    file_path,
    parent
):

    return VectorPreview(
        file_path=file_path,
        parent=parent,
        render_function=render_svg,
        file_type="svg"
    )