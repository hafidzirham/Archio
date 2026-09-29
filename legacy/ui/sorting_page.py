import os

import customtkinter as ctk
from tkinter import filedialog, messagebox

from app.logic.sorting.file_actions import (
    keep_file,
    move_file_action,
    delete_file
)

from app.logic.file_scanner import scan_files

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

        # Daftar file yang BELUM selesai diproses
        self.files = list(files)

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

        self.folder_label = ctk.CTkLabel(
            header,
            text=self.folder_path,
            font=ctk.CTkFont(
                family="Arial",
                size=13
            ),
            text_color="#777777"
        )

        self.folder_label.pack(
            anchor="w",
            pady=(4, 0)
        )

        # =================================================
        # CURRENT FILE NAME
        # =================================================

        self.file_name_label = ctk.CTkLabel(
            header,
            text="",
            font=ctk.CTkFont(
                family="Arial",
                size=16,
                weight="bold"
            ),
            text_color="#111111"
        )

        self.file_name_label.pack(
            anchor="w",
            pady=(3, 0)
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
    # BACK TO HOME
    # =====================================================

    def go_back(self):

        # Hentikan preview/video terlebih dahulu
        self.preview_panel.clear()

        self.on_back()


    # =====================================================
    # SELECT ANOTHER FOLDER
    # =====================================================

    def select_another_folder(self):

        # Hentikan preview/video terlebih dahulu
        self.preview_panel.clear()

        # Buka Windows Folder Picker
        folder = filedialog.askdirectory(
            title="Pilih Folder untuk Disortir",
            initialdir=self.folder_path
        )

        # -------------------------------------------------
        # User cancel
        # -------------------------------------------------

        if not folder:
            return

        # -------------------------------------------------
        # Scan folder baru
        # -------------------------------------------------

        new_files = scan_files(
            folder
        )

        # -------------------------------------------------
        # Update data
        # -------------------------------------------------

        self.folder_path = folder
        self.files = list(new_files)
        self.current_index = 0

        # -------------------------------------------------
        # Update header
        # -------------------------------------------------

        self.folder_label.configure(
            text=self.folder_path
        )

        self.file_name_label.configure(
            text=""
        )

        # -------------------------------------------------
        # Update UI
        # -------------------------------------------------

        self.update_file_view()


    # =====================================================
    # UPDATE FOLDER LABEL
    # =====================================================

    def update_folder_label(self):

        # Cari semua CTkLabel di header
        # dan update label yang berisi path folder.

        for widget in self.winfo_children():

            if not isinstance(
                widget,
                ctk.CTkFrame
            ):
                continue

            for child in widget.winfo_children():

                if isinstance(
                    child,
                    ctk.CTkLabel
                ):

                    text = child.cget(
                        "text"
                    )

                    if text == self.folder_path:
                        return

                    # Folder path biasanya
                    # adalah label terakhir di header.
                    # Jangan mengubah title "Sortir File".

        # Cara yang lebih aman:
        # simpan label folder sejak awal.


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
        # Semua file sudah selesai
        # -------------------------------------------------

        if total_files == 0:

            self.show_completed_state()

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
        # Update current file name
        # -------------------------------------------------

        filename = os.path.basename(
            current_file
        )

        self.file_name_label.configure(
            text=filename
        )

        # -------------------------------------------------
        # Preview
        # -------------------------------------------------

        self.preview_panel.show_file(
            current_file
        )


    # =====================================================
    # COMPLETION SCREEN
    # =====================================================
    def show_completed_state(self):

        # Hentikan preview terakhir
        self.preview_panel.clear()

        # Hilangkan nama file terakhir
        self.file_name_label.configure(
            text=""
        )

        # -------------------------------------------------
        # Container
        # -------------------------------------------------

        completion_frame = ctk.CTkFrame(
            self.preview_panel,
            fg_color="transparent"
        )

        # -------------------------------------------------
        # Check icon
        # -------------------------------------------------

        check_label = ctk.CTkLabel(
            completion_frame,
            text="✓",
            font=ctk.CTkFont(
                family="Arial",
                size=64,
                weight="bold"
            ),
            text_color="#16A34A"
        )

        check_label.pack(
            pady=(0, 10)
        )

        # -------------------------------------------------
        # Title
        # -------------------------------------------------

        title_label = ctk.CTkLabel(
            completion_frame,
            text="Semua file sudah tersortir",
            font=ctk.CTkFont(
                family="Arial",
                size=24,
                weight="bold"
            ),
            text_color="#111111"
        )

        title_label.pack()

        # -------------------------------------------------
        # Description
        # -------------------------------------------------

        description_label = ctk.CTkLabel(
            completion_frame,
            text=(
                "Semua file dalam folder ini sudah "
                "selesai diproses."
            ),
            font=ctk.CTkFont(
                family="Arial",
                size=14
            ),
            text_color="#777777"
        )

        description_label.pack(
            pady=(8, 20)
        )

        # -------------------------------------------------
        # Button
        # -------------------------------------------------

        folder_button = ctk.CTkButton(
            completion_frame,
            text="Sortir Folder Lain",
            width=190,
            height=45,
            corner_radius=10,
            fg_color="#2563EB",
            hover_color="#1D4ED8",
            text_color="#FFFFFF",
            font=ctk.CTkFont(
                family="Arial",
                size=15,
                weight="bold"
            ),
            command=self.select_another_folder
        )

        folder_button.pack()


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
    # REMOVE CURRENT FILE
    # =====================================================

    def remove_current_file(self):

        if not self.files:
            return

        self.preview_panel.clear()

        self.files.pop(
            self.current_index
        )

        if (
            self.current_index
            >= len(self.files)
            and len(self.files) > 0
        ):

            self.current_index = (
                len(self.files) - 1
            )

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

        # File sudah selesai diproses
        self.preview_panel.clear()

        if current_file in self.files:

            self.files.remove(
                current_file
            )

        # Adjust index

        if (
            self.current_index
            >= len(self.files)
            and len(self.files) > 0
        ):

            self.current_index = (
                len(self.files) - 1
            )

        self.update_file_view()


    # =====================================================
    # MOVE
    # =====================================================

    def move_current_file(self):

        current_file = (
            self.get_current_file()
        )

        if current_file is None:
            return

        source_folder = os.path.dirname(
            os.path.abspath(
                current_file
            )
        )

        destination_folder = (
            filedialog.askdirectory(
                title="Pilih Folder Tujuan",
                initialdir=source_folder
            )
        )

        if not destination_folder:
            return

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

        confirm = messagebox.askyesno(
            "Pindahkan File",
            "Pindahkan file ini ke:\n\n"
            f"{destination_folder}\n\n"
            "Lanjutkan?"
        )

        if not confirm:
            return

        self.preview_panel.clear()

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

        if not os.path.isfile(
            current_file
        ):

            messagebox.showerror(
                "Move Gagal",
                "File tidak ditemukan."
            )

            self.update_file_view()

            return

        success, result = move_file_action(
            current_file,
            destination_folder
        )

        if not success:

            messagebox.showerror(
                "Move Gagal",
                result
            )

            self.update_file_view()

            return

        if current_file in self.files:

            self.files.remove(
                current_file
            )

        if (
            self.current_index
            >= len(self.files)
            and len(self.files) > 0
        ):

            self.current_index = (
                len(self.files) - 1
            )

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

        confirm = messagebox.askyesno(
            "Hapus File",
            f"Masukkan file berikut ke Recycle Bin?\n\n"
            f"{filename}\n\n"
            "File masih dapat dipulihkan dari Recycle Bin."
        )

        if not confirm:
            return

        self.preview_panel.clear()

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

        if not os.path.isfile(
            current_file
        ):

            self.update_file_view()

            return

        success, message = delete_file(
            current_file
        )

        if not success:

            messagebox.showerror(
                "Delete Gagal",
                message
            )

            self.update_file_view()

            return

        if current_file in self.files:

            self.files.remove(
                current_file
            )

        if (
            self.current_index
            >= len(self.files)
            and len(self.files) > 0
        ):

            self.current_index = (
                len(self.files) - 1
            )

        self.update_file_view()