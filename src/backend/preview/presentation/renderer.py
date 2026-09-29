import sys
import json
import base64
import subprocess
import tempfile
import time
from pathlib import Path

import uno


# ============================================================
# CONFIG
# ============================================================

LIBREOFFICE_PATH = Path(
    r"C:\Program Files\LibreOffice\program\soffice.exe"
)

HOST = "127.0.0.1"
PORT = 2002

SUPPORTED_EXTENSIONS = {
    ".ppt",
    ".pptx",
    ".pptm",
    ".ppsx",
    ".ppsm",
    ".potx",
    ".potm",
    ".odp",
}


# ============================================================
# LIBREOFFICE WORKER
# ============================================================

class PresentationRenderer:

    def __init__(self):
        self.process = None
        self.context = None
        self.desktop = None

        self.current_document = None
        self.current_file = None

        self.profile_dir = None
        self.output_dir = None

        self.start_libreoffice()
        self.connect()

    # --------------------------------------------------------
    # Start LibreOffice
    # --------------------------------------------------------

    def start_libreoffice(self):

        self.profile_dir = tempfile.TemporaryDirectory(
            prefix="archio_lo_"
        )

        profile_path = Path(
            self.profile_dir.name
        )

        profile_url = uno.systemPathToFileUrl(
            str(profile_path)
        )

        command = [
            str(LIBREOFFICE_PATH),

            "--headless",
            "--invisible",
            "--norestore",
            "--nodefault",
            "--nofirststartwizard",

            f"-env:UserInstallation={profile_url}",

            (
                f"--accept=socket,"
                f"host={HOST},"
                f"port={PORT};"
                f"urp;"
                f"StarOffice.ComponentContext"
            ),
        ]

        self.process = subprocess.Popen(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )

        self.log("LibreOffice starting...")

    # --------------------------------------------------------
    # Connect UNO
    # --------------------------------------------------------

    def connect(self):

        local_context = uno.getComponentContext()

        resolver = (
            local_context.ServiceManager
            .createInstanceWithContext(
                "com.sun.star.bridge.UnoUrlResolver",
                local_context,
            )
        )

        last_error = None

        for _ in range(100):

            try:

                self.context = resolver.resolve(
                    (
                        f"uno:socket,"
                        f"host={HOST},"
                        f"port={PORT};"
                        f"urp;"
                        f"StarOffice.ComponentContext"
                    )
                )

                break

            except Exception as error:

                last_error = error
                time.sleep(0.1)

        else:

            raise RuntimeError(
                f"Gagal terhubung ke LibreOffice UNO: "
                f"{last_error}"
            )

        self.desktop = (
            self.context.ServiceManager
            .createInstanceWithContext(
                "com.sun.star.frame.Desktop",
                self.context,
            )
        )

        self.log("UNO connected")
        self.log("Desktop ready")

    # --------------------------------------------------------
    # Logging
    # --------------------------------------------------------

    @staticmethod
    def log(message):

        print(
            f"[PresentationRenderer] {message}",
            file=sys.stderr,
            flush=True,
        )

    # --------------------------------------------------------
    # Close current document
    # --------------------------------------------------------

    def close_current_document(self):

        if self.current_document is None:
            return

        try:

            self.current_document.close(
                True
            )

        except Exception:
            pass

        self.current_document = None
        self.current_file = None

    # --------------------------------------------------------
    # Open presentation
    # --------------------------------------------------------

    def open_presentation(
        self,
        file_path: Path,
    ):

        # Same presentation already open
        if (
            self.current_document is not None
            and self.current_file == file_path
        ):
            return 0.0

        # Close previous presentation
        self.close_current_document()

        self.log(
            f"Opening: {file_path.name}"
        )

        input_url = uno.systemPathToFileUrl(
            str(file_path)
        )

        start = time.perf_counter()

        document = (
            self.desktop.loadComponentFromURL(
                input_url,
                "_blank",
                0,
                (),
            )
        )

        elapsed = (
            time.perf_counter() - start
        )

        if document is None:

            raise RuntimeError(
                "LibreOffice gagal membuka "
                "presentation."
            )

        self.current_document = document
        self.current_file = file_path

        self.log(
            f"OPEN: {elapsed:.3f}s"
        )

        return elapsed

    # --------------------------------------------------------
    # Get slide count
    # --------------------------------------------------------

    def get_slide_count(self):

        if self.current_document is None:

            raise RuntimeError(
                "Tidak ada presentation yang terbuka."
            )

        pages = (
            self.current_document
            .getDrawPages()
        )

        return pages.getCount()

    # --------------------------------------------------------
    # Render slide
    # --------------------------------------------------------

    def render_slide(
        self,
        slide_index: int,
    ):

        if self.current_document is None:

            raise RuntimeError(
                "Tidak ada presentation yang terbuka."
            )

        pages = (
            self.current_document
            .getDrawPages()
        )

        total_slides = pages.getCount()

        if total_slides <= 0:

            raise RuntimeError(
                "Presentation tidak memiliki slide."
            )

        if (
            slide_index < 0
            or slide_index >= total_slides
        ):

            raise ValueError(
                f"Slide index {slide_index} "
                f"di luar range 0-{total_slides - 1}."
            )

        slide = pages.getByIndex(
            slide_index
        )

        controller = (
            self.current_document
            .getCurrentController()
        )

        # Select requested slide
        controller.setCurrentPage(
            slide
        )

        # Temporary output
        output_file = (
            self.output_dir
            / "current-slide.png"
        )

        if output_file.exists():

            try:
                output_file.unlink()
            except Exception:
                pass

        output_url = (
            uno.systemPathToFileUrl(
                str(output_file)
            )
        )

        filter_property = (
            uno.createUnoStruct(
                "com.sun.star.beans.PropertyValue"
            )
        )

        filter_property.Name = "FilterName"
        filter_property.Value = (
            "impress_png_Export"
        )

        start = time.perf_counter()

        self.current_document.storeToURL(
            output_url,
            (filter_property,),
        )

        export_time = (
            time.perf_counter()
            - start
        )

        if not output_file.exists():

            raise RuntimeError(
                "LibreOffice tidak menghasilkan "
                "PNG slide."
            )

        image_bytes = (
            output_file.read_bytes()
        )

        image_base64 = (
            base64.b64encode(
                image_bytes
            ).decode("ascii")
        )

        self.log(
            f"SLIDE {slide_index + 1}/"
            f"{total_slides} "
            f"EXPORT: {export_time:.3f}s"
        )

        return {
            "index": slide_index,
            "image": (
                "data:image/png;base64,"
                + image_base64
            ),
        }

    # --------------------------------------------------------
    # Render request
    # --------------------------------------------------------

    def render(
        self,
        file_path: str,
        slide_index: int = 0,
    ):

        path = Path(file_path)

        if not path.exists():

            raise FileNotFoundError(
                f"File tidak ditemukan: {path}"
            )

        extension = (
            path.suffix.lower()
        )

        if extension not in SUPPORTED_EXTENSIONS:

            raise ValueError(
                f"Format presentation tidak "
                f"didukung: {extension}"
            )

        # Create output directory once
        if self.output_dir is None:

            self.output_dir = Path(
                tempfile.mkdtemp(
                    prefix="archio_presentation_"
                )
            )

        total_start = (
            time.perf_counter()
        )

        open_time = (
            self.open_presentation(path)
        )

        total_slides = (
            self.get_slide_count()
        )

        slide = self.render_slide(
            slide_index
        )

        total_time = (
            time.perf_counter()
            - total_start
        )

        result = {

            "fileName": path.name,

            "extension": extension,

            "totalSlides": total_slides,

            "slides": [
                slide
            ],

            "benchmark": {

                "open": round(
                    open_time,
                    4,
                ),

                "total": round(
                    total_time,
                    4,
                ),
            },
        }

        return result

    # --------------------------------------------------------
    # Shutdown
    # --------------------------------------------------------

    def shutdown(self):

        self.log(
            "Shutting down..."
        )

        self.close_current_document()

        if self.process is not None:

            try:

                self.process.terminate()

            except Exception:
                pass

            self.process = None

        if self.profile_dir is not None:

            try:

                self.profile_dir.cleanup()

            except Exception:
                pass

            self.profile_dir = None

        self.log(
            "Shutdown complete"
        )


# ============================================================
# WORKER LOOP
# ============================================================

def main():

    renderer = None

    try:

        renderer = (
            PresentationRenderer()
        )

        renderer.log(
            "Worker ready"
        )

        # ----------------------------------------------------
        # Read JSON request line-by-line
        # ----------------------------------------------------

        for line in sys.stdin:

            line = line.strip()

            if not line:
                continue

            try:

                request = json.loads(
                    line
                )

                command = request.get(
                    "command",
                    "render",
                )

                # --------------------------------------------
                # Shutdown
                # --------------------------------------------

                if command == "shutdown":

                    print(
                        json.dumps(
                            {
                                "success": True
                            },
                            separators=(
                                ",",
                                ":",
                            ),
                        ),
                        flush=True,
                    )

                    break

                # --------------------------------------------
                # Render
                # --------------------------------------------

                if command != "render":

                    raise ValueError(
                        f"Unknown command: "
                        f"{command}"
                    )

                file_path = request.get(
                    "filePath"
                )

                if not file_path:

                    raise ValueError(
                        "filePath wajib diisi."
                    )

                slide_index = int(
                    request.get(
                        "slideIndex",
                        0,
                    )
                )

                result = renderer.render(
                    file_path,
                    slide_index,
                )

                response = {
                    "success": True,
                    "data": result,
                }

            except Exception as error:

                renderer.log(
                    f"ERROR: {error}"
                )

                response = {
                    "success": False,
                    "error": str(error),
                }

            print(
                json.dumps(
                    response,
                    separators=(
                        ",",
                        ":",
                    ),
                ),
                flush=True,
            )

    except KeyboardInterrupt:

        pass

    except Exception as error:

        if renderer is not None:

            renderer.log(
                f"FATAL: {error}"
            )

    finally:

        if renderer is not None:

            renderer.shutdown()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()