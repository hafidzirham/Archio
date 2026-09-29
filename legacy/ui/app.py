import customtkinter as ctk

from app.logic.folder_selector import select_folder
from app.logic.file_scanner import scan_files

from app.ui.home_page import HomePage
from app.ui.sorting_page import SortingPage


class FileSorterApp(ctk.CTk):

    def __init__(self):
        super().__init__()

        # =================================================
        # WINDOW CONFIGURATION
        # =================================================

        self.title("File Shorter")

        self.geometry(
            "1000x700"
        )

        self.minsize(
            900,
            600
        )

        self.configure(
            fg_color="#F7F7F7"
        )

        # =================================================
        # APPLICATION DATA
        # =================================================

        self.selected_folder = None
        self.files = []

        # =================================================
        # INITIAL PAGE
        # =================================================

        self.show_home_page()


    # =====================================================
    # PAGE MANAGEMENT
    # =====================================================

    def clear_page(self):
        """
        Menghapus halaman yang sedang ditampilkan.
        """

        for widget in self.winfo_children():
            widget.destroy()


    # =====================================================
    # HOME PAGE
    # =====================================================

    def show_home_page(self):
        """
        Menampilkan halaman awal.
        """

        self.clear_page()

        page = HomePage(
            parent=self,
            on_start=self.start_sorting
        )

        page.pack(
            fill="both",
            expand=True
        )


    # =====================================================
    # START SORTING
    # =====================================================

    def start_sorting(self):
        """
        Membuka folder picker dan memulai proses scanning.
        """

        folder = select_folder()

        # User membatalkan pemilihan folder
        if folder is None:
            return

        # Simpan folder yang dipilih
        self.selected_folder = folder

        # Scan file
        self.files = scan_files(
            self.selected_folder
        )

        # Pindah ke sorting page
        self.show_sorting_page()


    # =====================================================
    # SORTING PAGE
    # =====================================================

    def show_sorting_page(self):

        self.clear_page()

        page = SortingPage(
            parent=self,
            folder_path=self.selected_folder,
            files=self.files,
            on_back=self.show_home_page
        )

        page.pack(
            fill="both",
            expand=True
        )