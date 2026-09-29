import customtkinter as ctk

from app.logic.preview.preview_manager import show_preview


class PreviewPanel(ctk.CTkFrame):

    def __init__(self, parent):

        super().__init__(
            parent,
            fg_color="#FFFFFF",
            corner_radius=16
        )

        self.active_preview = None

        # ID untuk mencegah preview lama muncul kembali
        self.preview_generation = 0

        self.create_ui()


    # =====================================================
    # CREATE UI
    # =====================================================

    def create_ui(self):

        self.preview_label = ctk.CTkLabel(
            self,
            text="Preview",
            font=ctk.CTkFont(
                family="Arial",
                size=18,
                weight="bold"
            ),
            text_color="#999999"
        )

        self.preview_label.place(
            relx=0.5,
            rely=0.5,
            anchor="center"
        )


    # =====================================================
    # CLEANUP
    # =====================================================

    def cleanup_preview(self):

        if self.active_preview is not None:

            try:

                self.active_preview.destroy()

            except Exception:
                pass

            self.active_preview = None


    # =====================================================
    # CLEAR
    # =====================================================

    def clear(self):

        # Naikkan generation supaya callback preview lama
        # tidak boleh membuat preview lagi
        self.preview_generation += 1

        self.cleanup_preview()

        for widget in self.winfo_children():

            try:
                widget.destroy()
            except Exception:
                pass

        self.active_preview = None


    # =====================================================
    # SHOW MESSAGE
    # =====================================================

    def show_message(self, message):

        self.clear()

        self.preview_label = ctk.CTkLabel(
            self,
            text=message,
            font=ctk.CTkFont(
                family="Arial",
                size=18
            ),
            text_color="#777777"
        )

        self.preview_label.place(
            relx=0.5,
            rely=0.5,
            anchor="center"
        )


    # =====================================================
    # SHOW FILE
    # =====================================================

    def show_file(self, file_path):

        # Bersihkan preview sebelumnya
        self.clear()

        # Simpan ID request preview
        generation = self.preview_generation

        # =================================================
        # Tunggu sebentar setelah VLC ditutup
        # =================================================
        #
        # Ini penting ketika:
        #
        # VIDEO → FOTO
        #
        # supaya thread decoder/output VLC lama selesai
        # sebelum preview baru dibuat.
        #

        self.after(
            150,
            lambda: self._create_preview(
                file_path,
                generation
            )
        )


    # =====================================================
    # CREATE PREVIEW
    # =====================================================

    def _create_preview(
        self,
        file_path,
        generation
    ):

        # Jika sudah ada preview request yang lebih baru,
        # callback ini dibatalkan.
        if generation != self.preview_generation:
            return

        try:

            if not self.winfo_exists():
                return

        except Exception:
            return

        try:

            self.active_preview = show_preview(
                file_path,
                self
            )

        except Exception as error:

            self.show_message(
                f"Gagal menampilkan preview.\n\n{error}"
            )