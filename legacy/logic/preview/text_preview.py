import tkinter as tk
from tkinter import ttk


class TextPreview:
    def __init__(self, file_path, parent):
        self.file_path = file_path
        self.parent = parent

        self.container = tk.Frame(
            parent,
            bg="#FFFFFF"
        )

        self.container.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=20
        )

        self.search_matches = []
        self.current_match = -1

        self.create_ui()
        self.load_text()

    # =========================================================
    # UI
    # =========================================================

    def create_ui(self):

        toolbar = tk.Frame(
            self.container,
            bg="#F3F3F3"
        )

        toolbar.pack(
            fill="x",
            pady=(0, 8)
        )

        self.search_entry = tk.Entry(
            toolbar,
            width=30
        )

        self.search_entry.pack(
            side="left",
            padx=(8, 4),
            pady=6
        )

        self.search_entry.bind(
            "<Return>",
            self.search
        )

        self.search_button = tk.Button(
            toolbar,
            text="Search",
            command=self.search
        )

        self.search_button.pack(
            side="left",
            padx=2,
            pady=6
        )

        self.previous_button = tk.Button(
            toolbar,
            text="◀",
            width=3,
            command=self.previous_match
        )

        self.previous_button.pack(
            side="left",
            padx=(6, 2),
            pady=6
        )

        self.next_button = tk.Button(
            toolbar,
            text="▶",
            width=3,
            command=self.next_match
        )

        self.next_button.pack(
            side="left",
            padx=2,
            pady=6
        )

        self.result_label = tk.Label(
            toolbar,
            text="",
            font=("Arial", 9),
            bg="#F3F3F3",
            fg="#666666"
        )

        self.result_label.pack(
            side="left",
            padx=8
        )

        # Text area
        text_frame = tk.Frame(
            self.container,
            bg="#FFFFFF"
        )

        text_frame.pack(
            fill="both",
            expand=True
        )

        scrollbar = ttk.Scrollbar(
            text_frame,
            orient="vertical"
        )

        scrollbar.pack(
            side="right",
            fill="y"
        )

        self.text_widget = tk.Text(
            text_frame,
            wrap="word",
            font=("Consolas", 12),
            bg="#FAFAFA",
            fg="#222222",
            insertbackground="#222222",
            relief="flat",
            borderwidth=0,
            padx=20,
            pady=20,
            yscrollcommand=scrollbar.set
        )

        self.text_widget.pack(
            side="left",
            fill="both",
            expand=True
        )

        scrollbar.configure(
            command=self.text_widget.yview
        )

        # Highlight
        self.text_widget.tag_configure(
            "search",
            background="#FFE58A",
            foreground="#000000"
        )

        self.text_widget.tag_configure(
            "current_search",
            background="#FFB300",
            foreground="#000000"
        )

        self.text_widget.configure(
            state="disabled"
        )

        self.parent.bind(
            "<Control-f>",
            self.focus_search
        )

    # =========================================================
    # LOAD
    # =========================================================

    def load_text(self):

        try:

            with open(
                self.file_path,
                "r",
                encoding="utf-8",
                errors="replace"
            ) as file:

                content = file.read()

            self.text_widget.configure(
                state="normal"
            )

            self.text_widget.insert(
                "1.0",
                content
            )

            self.text_widget.configure(
                state="disabled"
            )

        except Exception as error:

            self.show_error(
                f"Gagal membaca file TXT.\n\n{error}"
            )

    # =========================================================
    # SEARCH
    # =========================================================

    def search(self, event=None):

        query = self.search_entry.get().strip()

        self.search_matches = []
        self.current_match = -1

        self.text_widget.configure(
            state="normal"
        )

        self.text_widget.tag_remove(
            "search",
            "1.0",
            tk.END
        )

        self.text_widget.tag_remove(
            "current_search",
            "1.0",
            tk.END
        )

        if not query:

            self.text_widget.configure(
                state="disabled"
            )

            self.result_label.configure(
                text=""
            )

            return

        start = "1.0"

        while True:

            position = self.text_widget.search(
                query,
                start,
                stopindex=tk.END,
                nocase=True
            )

            if not position:
                break

            end = (
                f"{position}+{len(query)}c"
            )

            self.search_matches.append(
                (
                    position,
                    end
                )
            )

            self.text_widget.tag_add(
                "search",
                position,
                end
            )

            start = end

        self.text_widget.configure(
            state="disabled"
        )

        if not self.search_matches:

            self.result_label.configure(
                text="Tidak ditemukan"
            )

            return

        self.current_match = 0

        self.show_current_match()

    def show_current_match(self):

        if not self.search_matches:
            return

        self.text_widget.configure(
            state="normal"
        )

        self.text_widget.tag_remove(
            "current_search",
            "1.0",
            tk.END
        )

        start, end = self.search_matches[
            self.current_match
        ]

        self.text_widget.tag_add(
            "current_search",
            start,
            end
        )

        self.text_widget.see(
            start
        )

        self.text_widget.configure(
            state="disabled"
        )

        self.result_label.configure(
            text=(
                f"{self.current_match + 1}"
                f"/"
                f"{len(self.search_matches)}"
            )
        )

    def next_match(self):

        if not self.search_matches:

            self.search()

            return

        self.current_match = (
            self.current_match + 1
        ) % len(self.search_matches)

        self.show_current_match()

    def previous_match(self):

        if not self.search_matches:

            self.search()

            return

        self.current_match = (
            self.current_match - 1
        ) % len(self.search_matches)

        self.show_current_match()

    # =========================================================
    # CTRL + F
    # =========================================================

    def focus_search(self, event=None):

        self.search_entry.focus_set()

        return "break"

    # =========================================================
    # ERROR
    # =========================================================

    def show_error(self, message):

        self.text_widget.configure(
            state="normal"
        )

        self.text_widget.delete(
            "1.0",
            tk.END
        )

        self.text_widget.insert(
            "1.0",
            message
        )

        self.text_widget.configure(
            state="disabled"
        )

    # =========================================================
    # CLEANUP
    # =========================================================

    def destroy(self):

        try:
            self.parent.unbind(
                "<Control-f>"
            )
        except Exception:
            pass

        try:
            self.container.destroy()
        except Exception:
            pass


def show_text(file_path, parent):

    return TextPreview(
        file_path,
        parent
    )