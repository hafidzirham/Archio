import os
import shutil
import subprocess
import tempfile
import threading
import tkinter as tk

from app.logic.preview.pdf_preview import PDFPreview


class DocumentPreview:
    def __init__(self, file_path, parent):
        self.file_path = file_path
        self.parent = parent

        self.temp_directory = None
        self.pdf_path = None
        self.pdf_preview = None

        self.destroyed = False

        self.container = tk.Frame(
            parent,
            bg="#FFFFFF"
        )

        self.container.pack(
            fill="both",
            expand=True,
            padx=0,
            pady=0
        )

        self.create_loading_ui()

        # Jalankan proses konversi di background
        self.worker = threading.Thread(
            target=self.convert_document,
            daemon=True
        )

        self.worker.start()

    # =========================================================
    # LOADING UI
    # =========================================================

    def create_loading_ui(self):
        self.loading_frame = tk.Frame(
            self.container,
            bg="#FFFFFF"
        )

        self.loading_frame.place(
            relx=0.5,
            rely=0.5,
            anchor="center"
        )

        self.loading_title = tk.Label(
            self.loading_frame,
            text="Menyiapkan preview DOCX...",
            font=("Arial", 16, "bold"),
            fg="#222222",
            bg="#FFFFFF"
        )

        self.loading_title.pack(
            pady=(0, 8)
        )

        self.loading_description = tk.Label(
            self.loading_frame,
            text="Sedang memproses dokumen.",
            font=("Arial", 11),
            fg="#777777",
            bg="#FFFFFF"
        )

        self.loading_description.pack()

    # =========================================================
    # FIND LIBREOFFICE
    # =========================================================

    def find_libreoffice(self):
        possible_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]

        for path in possible_paths:
            if os.path.exists(path):
                return path

        return shutil.which("soffice")

    # =========================================================
    # CONVERT DOCX → PDF
    # =========================================================

    def convert_document(self):
        try:
            libreoffice = self.find_libreoffice()

            if libreoffice is None:
                self.finish_with_error(
                    "LibreOffice tidak ditemukan.\n\n"
                    "Silakan install LibreOffice terlebih dahulu."
                )
                return

            # Buat folder temporary
            self.temp_directory = tempfile.mkdtemp(
                prefix="file_shorter_docx_"
            )

            # Konversi DOCX ke PDF
            command = [
                libreoffice,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                self.temp_directory,
                self.file_path
            ]

            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                error_message = (
                    result.stderr.strip()
                    or result.stdout.strip()
                    or "Konversi DOCX ke PDF gagal."
                )

                self.finish_with_error(
                    f"Gagal mengonversi DOCX.\n\n{error_message}"
                )

                return

            # Nama PDF hasil konversi
            filename_without_extension = os.path.splitext(
                os.path.basename(self.file_path)
            )[0]

            self.pdf_path = os.path.join(
                self.temp_directory,
                filename_without_extension + ".pdf"
            )

            # Kadang LibreOffice butuh sedikit waktu
            # untuk menyelesaikan penulisan file.
            if not os.path.exists(self.pdf_path):

                # Coba cari PDF hasil konversi
                pdf_files = [
                    filename
                    for filename in os.listdir(
                        self.temp_directory
                    )
                    if filename.lower().endswith(".pdf")
                ]

                if pdf_files:
                    self.pdf_path = os.path.join(
                        self.temp_directory,
                        pdf_files[0]
                    )

            if not os.path.exists(self.pdf_path):
                self.finish_with_error(
                    "Konversi selesai, tetapi file PDF hasil "
                    "konversi tidak ditemukan."
                )

                return

            # Kembali ke main UI thread
            self.parent.after(
                0,
                self.show_pdf_preview
            )

        except subprocess.TimeoutExpired:
            self.finish_with_error(
                "Konversi DOCX terlalu lama.\n\n"
                "Proses dibatalkan setelah 60 detik."
            )

        except Exception as error:
            self.finish_with_error(
                f"Gagal menampilkan DOCX.\n\n{error}"
            )

    # =========================================================
    # SHOW PDF
    # =========================================================

    def show_pdf_preview(self):
        if self.destroyed:
            return

        try:
            if not self.container.winfo_exists():
                return
        except Exception:
            return

        # Hapus loading screen
        try:
            self.loading_frame.destroy()
        except Exception:
            pass

        try:
            self.pdf_preview = PDFPreview(
                self.pdf_path,
                self.container
            )

        except Exception as error:
            self.show_error(
                f"Gagal menampilkan preview DOCX.\n\n{error}"
            )

    # =========================================================
    # ERROR
    # =========================================================

    def finish_with_error(self, message):
        if self.destroyed:
            return

        try:
            self.parent.after(
                0,
                lambda: self.show_error(message)
            )
        except Exception:
            pass

    def show_error(self, message):
        if self.destroyed:
            return

        try:
            if not self.container.winfo_exists():
                return
        except Exception:
            return

        try:
            self.loading_frame.destroy()
        except Exception:
            pass

        error_label = tk.Label(
            self.container,
            text=message,
            font=("Arial", 13),
            fg="#CC3333",
            bg="#FFFFFF",
            justify="left"
        )

        error_label.place(
            relx=0.5,
            rely=0.5,
            anchor="center"
        )

    # =========================================================
    # CLEANUP
    # =========================================================

    def destroy(self):
        self.destroyed = True

        try:
            if self.pdf_preview is not None:
                self.pdf_preview.destroy()
        except Exception:
            pass

        try:
            if self.temp_directory is not None:
                shutil.rmtree(
                    self.temp_directory,
                    ignore_errors=True
                )
        except Exception:
            pass

        try:
            self.container.destroy()
        except Exception:
            pass


def show_document(file_path, parent):
    return DocumentPreview(
        file_path,
        parent
    )