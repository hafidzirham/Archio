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
    # CLEAN ACTIVE PREVIEW
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

        self.cleanup_preview()

        for widget in self.winfo_children():
            widget.destroy()


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

        self.clear()

        self.active_preview = show_preview(
            file_path,
            self
        )