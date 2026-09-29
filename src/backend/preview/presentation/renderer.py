import sys
import json
import base64
import subprocess
import tempfile
import time
from pathlib import Path

import uno


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


class PresentationRenderer:

    def __init__(self):
        self.process = None
        self.context = None
        self.desktop = None

        self.current_document = None
        self.current_file = None
        self.current_file_signature = None

        self.profile_dir = None
        self.output_dir = None

        self.slide_cache = {}

        self.start_libreoffice()
        self.connect()

    # =========================================================
    # LIBREOFFICE
    # =========================================================

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

        self.log(
            "LibreOffice starting..."
        )

    # =========================================================
    # UNO CONNECTION
    # =========================================================

    def connect(self):

        local_context = (
            uno.getComponentContext()
        )

        resolver = (
            local_context
            .ServiceManager
            .createInstanceWithContext(
                "com.sun.star.bridge.UnoUrlResolver",
                local_context,
            )
        )

        last_error = None

        for _ in range(100):

            try:

                self.context = (
                    resolver.resolve(
                        (
                            f"uno:socket,"
                            f"host={HOST},"
                            f"port={PORT};"
                            f"urp;"
                            f"StarOffice.ComponentContext"
                        )
                    )
                )

                break

            except Exception as error:

                last_error = error

                time.sleep(0.1)

        else:

            raise RuntimeError(
                "Gagal terhubung ke LibreOffice UNO: "
                f"{last_error}"
            )

        self.desktop = (
            self.context
            .ServiceManager
            .createInstanceWithContext(
                "com.sun.star.frame.Desktop",
                self.context,
            )
        )

        self.log(
            "UNO connected"
        )

        self.log(
            "Desktop ready"
        )

    # =========================================================
    # LOG
    # =========================================================

    @staticmethod
    def log(message):

        print(
            f"[PresentationRenderer] {message}",
            file=sys.stderr,
            flush=True,
        )

    # =========================================================
    # FILE SIGNATURE
    # =========================================================

    @staticmethod
    def file_signature(path: Path):

        stat = path.stat()

        return (
            stat.st_mtime_ns,
            stat.st_size,
        )

    # =========================================================
    # CLEAR CACHE
    # =========================================================

    def clear_file_cache(self):

        self.slide_cache.clear()

    # =========================================================
    # CLOSE CURRENT DOCUMENT
    # =========================================================

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
        self.current_file_signature = None

    # =========================================================
    # OPEN PRESENTATION
    # =========================================================

    def open_presentation(
        self,
        file_path: Path,
    ):

        signature = (
            self.file_signature(
                file_path
            )
        )

        # -----------------------------------------------------
        # File masih sama → jangan buka ulang LibreOffice
        # -----------------------------------------------------

        if (
            self.current_document is not None
            and self.current_file == file_path
            and self.current_file_signature
            == signature
        ):

            return 0.0

        # -----------------------------------------------------
        # File berbeda
        # -----------------------------------------------------

        self.close_current_document()

        self.clear_file_cache()

        self.log(
            f"Opening: {file_path.name}"
        )

        input_url = (
            uno.systemPathToFileUrl(
                str(file_path)
            )
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
            time.perf_counter()
            - start
        )

        if document is None:

            raise RuntimeError(
                "LibreOffice gagal membuka "
                "presentation."
            )

        self.current_document = document
        self.current_file = file_path
        self.current_file_signature = signature

        self.log(
            f"OPEN: {elapsed:.3f}s"
        )

        return elapsed

    # =========================================================
    # SLIDE COUNT
    # =========================================================

    def get_slide_count(self):

        if self.current_document is None:

            raise RuntimeError(
                "Tidak ada presentation yang terbuka."
            )

        return (
            self.current_document
            .getDrawPages()
            .getCount()
        )

    # =========================================================
    # RENDER SLIDE
    # =========================================================

    def render_slide(
        self,
        slide_index: int,
    ):

        if self.current_document is None:

            raise RuntimeError(
                "Tidak ada presentation yang terbuka."
            )

        signature = (
            self.current_file_signature
        )

        cache_key = (
            str(self.current_file),
            signature,
            slide_index,
        )

        cached_path = (
            self.slide_cache.get(
                cache_key
            )
        )

        # -----------------------------------------------------
        # CACHE HIT
        # -----------------------------------------------------

        if (
            cached_path
            and cached_path.exists()
            and cached_path.stat().st_size > 0
        ):

            self.log(
                f"SLIDE {slide_index + 1} CACHE HIT"
            )

            image_bytes = (
                cached_path.read_bytes()
            )

            return {
                "index": slide_index,

                "image":
                    "data:image/png;base64,"
                    + base64.b64encode(
                        image_bytes
                    ).decode("ascii"),
            }

        pages = (
            self.current_document
            .getDrawPages()
        )

        total_slides = (
            pages.getCount()
        )

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
                f"di luar range "
                f"0-{total_slides - 1}."
            )

        slide = (
            pages.getByIndex(
                slide_index
            )
        )

        controller = (
            self.current_document
            .getCurrentController()
        )

        controller.setCurrentPage(
            slide
        )

        # -----------------------------------------------------
        # TEMP OUTPUT
        # -----------------------------------------------------

        output_file = (
            self.output_dir
            / f"slide_{slide_index}.png"
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

        filter_property.Name = (
            "FilterName"
        )

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

        # -----------------------------------------------------
        # CACHE FILE
        # -----------------------------------------------------

        cache_file = (
            self.output_dir
            / f"cache_{slide_index}.png"
        )

        if cache_file != output_file:

            try:

                cache_file.write_bytes(
                    output_file.read_bytes()
                )

            except Exception:

                cache_file = output_file

        self.slide_cache[
            cache_key
        ] = cache_file

        image_bytes = (
            cache_file.read_bytes()
        )

        self.log(
            (
                f"SLIDE "
                f"{slide_index + 1}/"
                f"{total_slides} "
                f"EXPORT: "
                f"{export_time:.3f}s"
            )
        )

        return {
            "index": slide_index,

            "image":
                "data:image/png;base64,"
                + base64.b64encode(
                    image_bytes
                ).decode("ascii"),
        }

    # =========================================================
    # RENDER
    # =========================================================

    def render(
        self,
        file_path: str,
        slide_index: int = 0,
    ):

        path = Path(
            file_path
        )

        if not path.exists():

            raise FileNotFoundError(
                f"File tidak ditemukan: {path}"
            )

        extension = (
            path.suffix.lower()
        )

        if (
            extension
            not in SUPPORTED_EXTENSIONS
        ):

            raise ValueError(
                "Format presentation "
                f"tidak didukung: {extension}"
            )

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
            self.open_presentation(
                path
            )
        )

        total_slides = (
            self.get_slide_count()
        )

        slide = (
            self.render_slide(
                slide_index
            )
        )

        total_time = (
            time.perf_counter()
            - total_start
        )

        return {

            "fileName":
                path.name,

            "extension":
                extension,

            "totalSlides":
                total_slides,

            "slides":
                [slide],

            "benchmark": {

                "open":
                    round(
                        open_time,
                        4,
                    ),

                "total":
                    round(
                        total_time,
                        4,
                    ),
            },
        }

    # =========================================================
    # SHUTDOWN
    # =========================================================

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


# =============================================================
# MAIN
# =============================================================

def main():

    renderer = None

    try:

        renderer = (
            PresentationRenderer()
        )

        renderer.log(
            "Worker ready"
        )

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

                # -------------------------------------------------
                # SHUTDOWN
                # -------------------------------------------------

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

                # -------------------------------------------------
                # UNKNOWN COMMAND
                # -------------------------------------------------

                if command != "render":

                    raise ValueError(
                        f"Unknown command: {command}"
                    )

                # -------------------------------------------------
                # FILE PATH
                # -------------------------------------------------

                file_path = (
                    request.get(
                        "filePath"
                    )
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

                # -------------------------------------------------
                # RENDER
                # -------------------------------------------------

                result = renderer.render(
                    file_path,
                    slide_index,
                )

                response = {
                    "success": True,
                    "data": result,
                }

            except Exception as error:

                if renderer is not None:

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


if __name__ == "__main__":
    main()