import os
import glob

from PIL import Image

from app.logic.preview.vector_preview import VectorPreview


# =========================================================
# FIND GHOSTSCRIPT
# =========================================================

def find_ghostscript():

    # =====================================================
    # 1. CHECK PATH ENVIRONMENT
    # =====================================================

    possible_names = [
        "gswin64c.exe",
        "gswin32c.exe",
        "gs.exe"
    ]

    for name in possible_names:

        for folder in os.environ.get(
            "PATH",
            ""
        ).split(os.pathsep):

            if not folder:
                continue

            path = os.path.join(
                folder,
                name
            )

            if os.path.isfile(path):

                return path

    # =====================================================
    # 2. COMMON PROGRAM FILES PATH
    # =====================================================

    common_patterns = [

        r"C:\Program Files\gs\*\bin\gswin64c.exe",

        r"C:\Program Files\gs\*\bin\gswin32c.exe",

        r"C:\Program Files (x86)\gs\*\bin\gswin32c.exe",

        r"C:\Program Files (x86)\gs\*\bin\gswin64c.exe",

    ]

    for pattern in common_patterns:

        matches = glob.glob(
            pattern
        )

        if matches:

            # Ambil versi terbaru
            matches.sort(
                reverse=True
            )

            return matches[0]

    return None


# =========================================================
# RENDER EPS
# =========================================================

def render_eps(file_path):

    ghostscript = find_ghostscript()

    if ghostscript is None:

        raise Exception(
            "Ghostscript tidak ditemukan.\n\n"
            "Install Ghostscript 64-bit terlebih dahulu.\n\n"
            "Setelah itu restart aplikasi File Shorter."
        )

    try:

        # =================================================
        # Tell Pillow where Ghostscript is
        # =================================================

        os.environ[
            "PATH"
        ] = (
            os.path.dirname(
                ghostscript
            )
            + os.pathsep
            + os.environ.get(
                "PATH",
                ""
            )
        )

        # =================================================
        # OPEN EPS
        # =================================================

        image = Image.open(
            file_path
        )

        # =================================================
        # FORCE EPS RENDER
        #
        # scale=2 memberikan resolusi lebih besar
        # sehingga zoom sampai 200% masih lebih bagus.
        # =================================================

        image.load(
            scale=2
        )

        # =================================================
        # NORMALIZE
        # =================================================

        if image.mode not in (
            "RGB",
            "RGBA"
        ):

            image = image.convert(
                "RGBA"
            )

        else:

            image = image.copy()

        return image

    except Exception as error:

        raise Exception(
            f"Gagal merender EPS:\n{error}"
        )


# =========================================================
# SHOW EPS
# =========================================================

def show_eps(
    file_path,
    parent
):

    return VectorPreview(
        file_path=file_path,
        parent=parent,
        render_function=render_eps,
        file_type="eps"
    )