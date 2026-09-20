import os

import customtkinter as ctk
from tkinter import filedialog, messagebox

from app.logic.sorting.file_actions import (
    keep_file,
    move_file_action,
    delete_file
)

from app.ui.components.preview_panel import PreviewPanel
from app.ui.components.navigation_bar import NavigationBar
from app.ui.components.action_buttons import ActionButtons


class SortingPage(ctk.CTkFrame):

    def __init__(
        self,
        parent,
        folder_path,
        files,
        on_back
    ):

        super().__init__(
            parent,
            fg_color="#F7F7F7"
        )

        # =================================================
        # DATA
        # =================================================

        self.folder_path = folder_path

        self.files = list(
            files
        )

        self.on_back = on_back

        self.current_index = 0

        # =================================================
        # CREATE UI
        # =================================================

        self.create_ui()

        # =================================================
        # INITIAL FILE
        # =================================================

        self.update_file_view()


    # =====================================================
    # CREATE UI
    # =====================================================

    def create_ui(self):

        # =================================================
        # HEADER
        # =================================================

        header = ctk.CTkFrame(
            self,
            fg_color="transparent"
        )

        header.pack(
            fill="x",
            padx=30,
            pady=(20, 10)
        )


        # =================================================
        # BACK BUTTON
        # =================================================

        back_button = ctk.CTkButton(
            header,
            text="← Pilih Folder Lain",
            width=150,
            height=36,
            corner_radius=9,
            fg_color="#E5E7EB",
            hover_color="#D1D5DB",
            text_color="#111111",
            command=self.go_back
        )

        back_button.pack(
            anchor="w",
            pady=(0, 12)
        )


        # =================================================
        # TITLE
        # =================================================

        title = ctk.CTkLabel(
            header,
            text="Sortir File",
            font=ctk.CTkFont(
                family="Arial",
                size=28,
                weight="bold"
            ),
            text_color="#111111"
        )

        title.pack(
            anchor="w"
        )


        # =================================================
        # FOLDER PATH
        # =================================================

        folder_label = ctk.CTkLabel(
            header,
            text=self.folder_path,
            font=ctk.CTkFont(
                family="Arial",
                size=13
            ),
            text_color="#777777"
        )

        folder_label.pack(
            anchor="w",
            pady=(4, 0)
        )


        # =================================================
        # PREVIEW PANEL
        # =================================================

        self.preview_panel = PreviewPanel(
            self
        )

        self.preview_panel.pack(
            fill="both",
            expand=True,
            padx=30,
            pady=15
        )


        # =================================================
        # NAVIGATION
        # =================================================

        self.navigation_bar = NavigationBar(
            self,
            on_previous=self.previous_file,
            on_next=self.next_file
        )

        self.navigation_bar.pack(
            pady=10
        )


        # =================================================
        # ACTION BUTTONS
        # =================================================

        self.action_buttons = ActionButtons(
            self,
            on_keep=self.keep_current_file,
            on_move=self.move_current_file,
            on_delete=self.delete_current_file
        )

        self.action_buttons.pack(
            pady=(5, 25)
        )


    # =====================================================
    # BACK
    # =====================================================

    def go_back(self):

        # Hentikan preview/video terlebih dahulu
        self.preview_panel.clear()

        self.on_back()


    # =====================================================
    # PREVIOUS
    # =====================================================

    def previous_file(self):

        if not self.files:
            return

        if self.current_index > 0:

            self.current_index -= 1

            self.update_file_view()


    # =====================================================
    # NEXT
    # =====================================================

    def next_file(self):

        if not self.files:
            return

        if self.current_index < len(
            self.files
        ) - 1:

            self.current_index += 1

            self.update_file_view()


    # =====================================================
    # UPDATE FILE VIEW
    # =====================================================

    def update_file_view(self):

        total_files = len(
            self.files
        )


        # -------------------------------------------------
        # Update counter
        # -------------------------------------------------

        self.navigation_bar.update_counter(
            self.current_index,
            total_files
        )


        # -------------------------------------------------
        # Update navigation
        # -------------------------------------------------

        self.navigation_bar.update_button_state(
            self.current_index,
            total_files
        )


        # -------------------------------------------------
        # No files
        # -------------------------------------------------

        if total_files == 0:

            self.preview_panel.show_message(
                "Semua file sudah diproses."
            )

            return


        # -------------------------------------------------
        # Safety index
        # -------------------------------------------------

        if self.current_index >= total_files:

            self.current_index = (
                total_files - 1
            )


        # -------------------------------------------------
        # Current file
        # -------------------------------------------------

        current_file = self.files[
            self.current_index
        ]


        # -------------------------------------------------
        # Preview
        # -------------------------------------------------

        self.preview_panel.show_file(
            current_file
        )


    # =====================================================
    # GET CURRENT FILE
    # =====================================================

    def get_current_file(self):

        if not self.files:
            return None

        if self.current_index >= len(
            self.files
        ):

            return None

        return self.files[
            self.current_index
        ]


    # =====================================================
    # REMOVE CURRENT FILE FROM LIST
    # =====================================================

    def remove_current_file(self):

        if not self.files:
            return


        # Hentikan preview terlebih dahulu
        self.preview_panel.clear()


        # Remove file dari list
        self.files.pop(
            self.current_index
        )


        # Jika index sudah melewati
        # file terakhir
        if (
            self.current_index
            >= len(self.files)
            and len(self.files) > 0
        ):

            self.current_index = (
                len(self.files) - 1
            )


        # Refresh
        self.update_file_view()


    # =====================================================
    # KEEP
    # =====================================================

    def keep_current_file(self):

        current_file = (
            self.get_current_file()
        )


        if current_file is None:
            return


        success, message = keep_file(
            current_file
        )


        if not success:

            messagebox.showerror(
                "Keep Gagal",
                message
            )

            return


        # Keep tidak menghapus file.
        # Langsung lanjut ke file berikutnya.

        if self.current_index < len(
            self.files
        ) - 1:

            self.current_index += 1

            self.update_file_view()

        else:

            messagebox.showinfo(
                "Selesai",
                "File terakhir sudah di-keep."
            )


    # =====================================================
    # MOVE
    # =====================================================

    def move_current_file(self):

        current_file = (
            self.get_current_file()
        )


        if current_file is None:
            return


        # -------------------------------------------------
        # Folder asal file
        # -------------------------------------------------

        source_folder = os.path.dirname(
            os.path.abspath(
                current_file
            )
        )


        # -------------------------------------------------
        # Buka Windows Folder Picker
        # langsung di folder asal file
        # -------------------------------------------------

        destination_folder = (
            filedialog.askdirectory(
                title="Pilih Folder Tujuan",
                initialdir=source_folder
            )
        )


        # User cancel
        if not destination_folder:
            return


        # -------------------------------------------------
        # Jangan pilih folder yang sama
        # -------------------------------------------------

        if os.path.abspath(
            destination_folder
        ) == os.path.abspath(
            source_folder
        ):

            messagebox.showwarning(
                "Move",
                "Folder tujuan sama dengan folder asal."
            )

            return


        # -------------------------------------------------
        # Konfirmasi
        # -------------------------------------------------

        confirm = messagebox.askyesno(
            "Pindahkan File",
            "Pindahkan file ini ke:\n\n"
            f"{destination_folder}\n\n"
            "Lanjutkan?"
        )


        if not confirm:
            return


        # -------------------------------------------------
        # Hentikan preview
        # -------------------------------------------------

        self.preview_panel.clear()


        # -------------------------------------------------
        # Tunggu VLC release file
        # -------------------------------------------------

        self.after(
            300,
            lambda: self.perform_move(
                current_file,
                destination_folder
            )
        )


    # =====================================================
    # PERFORM MOVE
    # =====================================================

    def perform_move(
        self,
        current_file,
        destination_folder
    ):

        # Pastikan file masih ada
        if not os.path.isfile(
            current_file
        ):

            messagebox.showerror(
                "Move Gagal",
                "File tidak ditemukan."
            )

            self.update_file_view()

            return


        # -------------------------------------------------
        # Move
        # -------------------------------------------------

        success, result = move_file_action(
            current_file,
            destination_folder
        )


        # -------------------------------------------------
        # Gagal
        # -------------------------------------------------

        if not success:

            messagebox.showerror(
                "Move Gagal",
                result
            )

            self.update_file_view()

            return


        # -------------------------------------------------
        # Remove dari daftar
        # -------------------------------------------------

        if current_file in self.files:

            self.files.remove(
                current_file
            )


        # -------------------------------------------------
        # Adjust index
        # -------------------------------------------------

        if (
            self.current_index
            >= len(self.files)
            and len(self.files) > 0
        ):

            self.current_index = (
                len(self.files) - 1
            )


        # -------------------------------------------------
        # Update UI
        # -------------------------------------------------

        self.update_file_view()


    # =====================================================
    # DELETE
    # =====================================================

    def delete_current_file(self):

        current_file = (
            self.get_current_file()
        )


        if current_file is None:
            return


        filename = os.path.basename(
            current_file
        )


        # -------------------------------------------------
        # Confirmation
        # -------------------------------------------------

        confirm = messagebox.askyesno(
            "Hapus File",
            f"Masukkan file berikut ke Recycle Bin?\n\n"
            f"{filename}\n\n"
            "File masih dapat dipulihkan dari Recycle Bin."
        )


        if not confirm:
            return


        # -------------------------------------------------
        # Hentikan preview
        # -------------------------------------------------

        self.preview_panel.clear()


        # -------------------------------------------------
        # Tunggu VLC release file
        # -------------------------------------------------

        self.after(
            300,
            lambda: self.perform_delete(
                current_file
            )
        )


    # =====================================================
    # PERFORM DELETE
    # =====================================================

    def perform_delete(
        self,
        current_file
    ):

        # Pastikan file masih ada
        if not os.path.isfile(
            current_file
        ):

            self.update_file_view()

            return


        # -------------------------------------------------
        # Delete → Recycle Bin
        # -------------------------------------------------

        success, message = delete_file(
            current_file
        )


        # -------------------------------------------------
        # Gagal
        # -------------------------------------------------

        if not success:

            messagebox.showerror(
                "Delete Gagal",
                message
            )

            self.update_file_view()

            return


        # -------------------------------------------------
        # Remove dari daftar
        # -------------------------------------------------

        if current_file in self.files:

            self.files.remove(
                current_file
            )


        # -------------------------------------------------
        # Adjust index
        # -------------------------------------------------

        if (
            self.current_index
            >= len(self.files)
            and len(self.files) > 0
        ):

            self.current_index = (
                len(self.files) - 1
            )


        # -------------------------------------------------
        # Update UI
        # -------------------------------------------------

        self.update_file_view()