import tkinter as tk
import customtkinter as ctk
import pymupdf

from PIL import Image, ImageTk


class PDFPreview:
    def __init__(self, file_path, parent):
        self.file_path = file_path
        self.parent = parent

        self.container = ctk.CTkFrame(
            parent,
            fg_color="#F5F5F7",
            corner_radius=0
        )

        self.container.pack(
            fill="both",
            expand=True
        )

        self.document = None

        self.current_page = 0

        self.zoom = 1.0
        self.min_zoom = 0.5
        self.max_zoom = 3.0
        self.zoom_step = 0.25

        self.page_photo = None
        self.page_image = None

        self.image_x = 0
        self.image_y = 0

        self.search_results = []
        self.current_search_index = -1
        self.highlight_id = None

        self.resize_after_id = None

        self.create_ui()
        self.load_pdf()

    # =========================================================
    # MAIN UI
    # =========================================================

    def create_ui(self):

        # -----------------------------------------------------
        # TITLE
        # -----------------------------------------------------

        self.title_label = ctk.CTkLabel(
            self.container,
            text="PDF Preview",
            font=ctk.CTkFont(
                family="Arial",
                size=18,
                weight="bold"
            ),
            text_color="#1D1D1F"
        )

        self.title_label.pack(
            anchor="w",
            padx=20,
            pady=(14, 8)
        )

        # -----------------------------------------------------
        # TOOLBAR AREA
        # -----------------------------------------------------

        toolbar_area = ctk.CTkFrame(
            self.container,
            fg_color="transparent"
        )

        toolbar_area.pack(
            fill="x",
            padx=20,
            pady=(0, 10)
        )

        # Toolbar pill
        self.toolbar = ctk.CTkFrame(
            toolbar_area,
            fg_color="#FFFFFF",
            corner_radius=14,
            height=50
        )

        self.toolbar.pack(
            anchor="center",
            pady=0
        )

        self.toolbar.grid_propagate(False)

        # Fixed groups
        self.create_zoom_group()
        self.create_page_group()
        self.create_search_group()

        # Responsive layout
        self.toolbar.bind(
            "<Configure>",
            self.on_toolbar_resize
        )

        toolbar_area.bind(
            "<Configure>",
            self.on_toolbar_area_resize
        )

        # -----------------------------------------------------
        # VIEWER
        # -----------------------------------------------------

        viewer_frame = ctk.CTkFrame(
            self.container,
            fg_color="#E5E5EA",
            corner_radius=14
        )

        viewer_frame.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=(0, 18)
        )

        self.canvas = tk.Canvas(
            viewer_frame,
            bg="#E5E5EA",
            highlightthickness=0,
            bd=0
        )

        self.canvas.pack(
            side="left",
            fill="both",
            expand=True
        )

        self.scrollbar = ctk.CTkScrollbar(
            viewer_frame,
            orientation="vertical",
            command=self.canvas.yview
        )

        self.scrollbar.pack(
            side="right",
            fill="y",
            padx=(0, 4),
            pady=4
        )

        self.canvas.configure(
            yscrollcommand=self.scrollbar.set
        )

        self.canvas.bind(
            "<Configure>",
            self.on_canvas_resize
        )

        self.canvas.bind(
            "<MouseWheel>",
            self.on_mousewheel
        )

        self.parent.bind(
            "<Control-f>",
            self.focus_search
        )

    # =========================================================
    # ZOOM GROUP
    # =========================================================

    def create_zoom_group(self):

        self.zoom_group = ctk.CTkFrame(
            self.toolbar,
            fg_color="#F2F2F7",
            corner_radius=10
        )

        self.zoom_group.grid(
            row=0,
            column=0,
            padx=6,
            pady=7,
            sticky="w"
        )

        self.zoom_out_button = ctk.CTkButton(
            self.zoom_group,
            text="−",
            width=32,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=17
            ),
            command=self.zoom_out
        )

        self.zoom_out_button.pack(
            side="left"
        )

        self.zoom_label = ctk.CTkLabel(
            self.zoom_group,
            text="100%",
            width=54,
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=11
            )
        )

        self.zoom_label.pack(
            side="left"
        )

        self.zoom_in_button = ctk.CTkButton(
            self.zoom_group,
            text="+",
            width=32,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=17
            ),
            command=self.zoom_in
        )

        self.zoom_in_button.pack(
            side="left"
        )

        self.reset_zoom_button = ctk.CTkButton(
            self.toolbar,
            text="Reset",
            width=58,
            height=32,
            corner_radius=9,
            fg_color="#F2F2F7",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=11
            ),
            command=self.reset_zoom
        )

        self.reset_zoom_button.grid(
            row=0,
            column=1,
            padx=(2, 8),
            pady=7
        )

    # =========================================================
    # PAGE GROUP
    # =========================================================

    def create_page_group(self):

        self.page_group = ctk.CTkFrame(
            self.toolbar,
            fg_color="#F2F2F7",
            corner_radius=10
        )

        self.page_group.grid(
            row=0,
            column=2,
            padx=4,
            pady=7
        )

        self.previous_button = ctk.CTkButton(
            self.page_group,
            text="‹",
            width=32,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=18
            ),
            command=self.previous_page
        )

        self.previous_button.pack(
            side="left"
        )

        self.page_entry = ctk.CTkEntry(
            self.page_group,
            width=48,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            border_width=0,
            text_color="#1D1D1F",
            justify="center",
            font=ctk.CTkFont(
                size=11
            )
        )

        self.page_entry.pack(
            side="left"
        )

        self.page_entry.bind(
            "<Return>",
            self.go_to_page
        )

        self.page_total_label = ctk.CTkLabel(
            self.page_group,
            text="/ 0",
            width=34,
            text_color="#6E6E73",
            font=ctk.CTkFont(
                size=11
            )
        )

        self.page_total_label.pack(
            side="left"
        )

        self.next_button = ctk.CTkButton(
            self.page_group,
            text="›",
            width=32,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=18
            ),
            command=self.next_page
        )

        self.next_button.pack(
            side="left"
        )

    # =========================================================
    # SEARCH GROUP
    # =========================================================

    def create_search_group(self):

        self.search_group = ctk.CTkFrame(
            self.toolbar,
            fg_color="#F2F2F7",
            corner_radius=10
        )

        self.search_group.grid(
            row=0,
            column=3,
            padx=(4, 6),
            pady=7,
            sticky="ew"
        )

        self.search_group.grid_columnconfigure(
            0,
            weight=1
        )

        self.search_entry = ctk.CTkEntry(
            self.search_group,
            width=180,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            border_width=0,
            text_color="#1D1D1F",
            placeholder_text="Search in PDF",
            placeholder_text_color="#8E8E93",
            font=ctk.CTkFont(
                size=11
            )
        )

        self.search_entry.grid(
            row=0,
            column=0,
            sticky="ew",
            padx=(8, 2)
        )

        self.search_entry.bind(
            "<Return>",
            self.search
        )

        self.search_button = ctk.CTkButton(
            self.search_group,
            text="⌕",
            width=32,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=16
            ),
            command=self.search
        )

        self.search_button.grid(
            row=0,
            column=1
        )

        self.previous_search_button = ctk.CTkButton(
            self.search_group,
            text="‹",
            width=28,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=17
            ),
            command=self.previous_match
        )

        self.previous_search_button.grid(
            row=0,
            column=2
        )

        self.next_search_button = ctk.CTkButton(
            self.search_group,
            text="›",
            width=28,
            height=32,
            corner_radius=8,
            fg_color="transparent",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=17
            ),
            command=self.next_match
        )

        self.next_search_button.grid(
            row=0,
            column=3
        )

        self.search_result_label = ctk.CTkLabel(
            self.search_group,
            text="",
            width=45,
            text_color="#6E6E73",
            font=ctk.CTkFont(
                size=10
            )
        )

        self.search_result_label.grid(
            row=0,
            column=4,
            padx=(0, 6)
        )

    # =========================================================
    # RESPONSIVE TOOLBAR
    # =========================================================

    def on_toolbar_area_resize(self, event):

        available_width = event.width

        if available_width < 900:

            self.toolbar.configure(
                width=820
            )

        else:

            self.toolbar.configure(
                width=min(
                    980,
                    available_width
                )
            )

    def on_toolbar_resize(self, event):

        width = event.width

        if width <= 1:
            return

        # Search mendapatkan ruang lebih besar
        # daripada group lainnya.
        self.toolbar.grid_columnconfigure(
            0,
            weight=0
        )

        self.toolbar.grid_columnconfigure(
            1,
            weight=0
        )

        self.toolbar.grid_columnconfigure(
            2,
            weight=0
        )

        self.toolbar.grid_columnconfigure(
            3,
            weight=1
        )

        # Search entry mengikuti ukuran toolbar
        search_width = max(
            140,
            width - 500
        )

        self.search_entry.configure(
            width=search_width
        )

    # =========================================================
    # LOAD
    # =========================================================

    def load_pdf(self):

        try:

            self.document = pymupdf.open(
                self.file_path
            )

            total_pages = len(
                self.document
            )

            self.title_label.configure(
                text=f"PDF Preview • {total_pages} halaman"
            )

            self.page_total_label.configure(
                text=f"/ {total_pages}"
            )

            self.page_entry.delete(
                0,
                tk.END
            )

            self.page_entry.insert(
                0,
                "1"
            )

            self.parent.after(
                100,
                self.render_page
            )

        except Exception as error:

            self.show_error(
                f"Gagal membuka PDF.\n\n{error}"
            )

    # =========================================================
    # RENDER PAGE
    # =========================================================

    def render_page(self):

        if self.document is None:
            return

        total_pages = len(
            self.document
        )

        if total_pages == 0:
            return

        self.current_page = max(
            0,
            min(
                self.current_page,
                total_pages - 1
            )
        )

        page = self.document.load_page(
            self.current_page
        )

        matrix = pymupdf.Matrix(
            self.zoom,
            self.zoom
        )

        pixmap = page.get_pixmap(
            matrix=matrix,
            alpha=False
        )

        image = Image.frombytes(
            "RGB",
            (
                pixmap.width,
                pixmap.height
            ),
            pixmap.samples
        )

        self.page_image = image

        self.page_photo = ImageTk.PhotoImage(
            image
        )

        self.canvas.delete(
            "all"
        )

        self.highlight_id = None

        canvas_width = self.canvas.winfo_width()

        if canvas_width <= 1:
            canvas_width = 900

        self.image_x = max(
            20,
            (canvas_width - image.width) / 2
        )

        self.image_y = 25

        self.canvas.create_image(
            self.image_x,
            self.image_y,
            image=self.page_photo,
            anchor="nw"
        )

        self.canvas.configure(
            scrollregion=(
                0,
                0,
                max(
                    canvas_width,
                    image.width + 40
                ),
                image.height + 50
            )
        )

        self.update_page_controls()

        if (
            self.search_results
            and self.current_search_index >= 0
        ):

            self.draw_search_highlight()

    # =========================================================
    # CANVAS RESIZE
    # =========================================================

    def on_canvas_resize(self, event):

        if self.document is None:
            return

        if self.resize_after_id:

            try:
                self.parent.after_cancel(
                    self.resize_after_id
                )
            except Exception:
                pass

        self.resize_after_id = (
            self.parent.after(
                120,
                self.render_page
            )
        )

    # =========================================================
    # PAGE CONTROL
    # =========================================================

    def update_page_controls(self):

        if self.document is None:
            return

        page_number = (
            self.current_page + 1
        )

        self.page_entry.delete(
            0,
            tk.END
        )

        self.page_entry.insert(
            0,
            str(page_number)
        )

        total_pages = len(
            self.document
        )

        self.previous_button.configure(
            state=(
                "normal"
                if page_number > 1
                else "disabled"
            )
        )

        self.next_button.configure(
            state=(
                "normal"
                if page_number < total_pages
                else "disabled"
            )
        )

        self.zoom_label.configure(
            text=f"{int(self.zoom * 100)}%"
        )

    def previous_page(self):

        if self.current_page > 0:

            self.current_page -= 1

            self.render_page()

    def next_page(self):

        if (
            self.document
            and self.current_page
            < len(self.document) - 1
        ):

            self.current_page += 1

            self.render_page()

    def go_to_page(self, event=None):

        if self.document is None:
            return

        try:

            page_number = int(
                self.page_entry.get()
            )

        except ValueError:

            self.update_page_controls()

            return

        total_pages = len(
            self.document
        )

        page_number = max(
            1,
            min(
                page_number,
                total_pages
            )
        )

        self.current_page = (
            page_number - 1
        )

        self.render_page()

    # =========================================================
    # ZOOM
    # =========================================================

    def zoom_in(self):

        if self.zoom < self.max_zoom:

            self.zoom = round(
                self.zoom + self.zoom_step,
                2
            )

            self.render_page()

    def zoom_out(self):

        if self.zoom > self.min_zoom:

            self.zoom = round(
                self.zoom - self.zoom_step,
                2
            )

            self.render_page()

    def reset_zoom(self):

        self.zoom = 1.0

        self.render_page()

    # =========================================================
    # SEARCH
    # =========================================================

    def search(self, event=None):

        if self.document is None:
            return

        query = (
            self.search_entry
            .get()
            .strip()
        )

        self.search_results = []
        self.current_search_index = -1

        self.search_result_label.configure(
            text=""
        )

        if not query:

            self.render_page()

            return

        for page_number in range(
            len(self.document)
        ):

            page = self.document.load_page(
                page_number
            )

            matches = page.search_for(
                query
            )

            for rectangle in matches:

                self.search_results.append(
                    (
                        page_number,
                        rectangle
                    )
                )

        if not self.search_results:

            self.search_result_label.configure(
                text="Not found"
            )

            self.render_page()

            return

        self.current_search_index = 0

        self.show_search_result()

    # =========================================================
    # SEARCH RESULT
    # =========================================================

    def show_search_result(self):

        if not self.search_results:
            return

        (
            page_number,
            rectangle
        ) = self.search_results[
            self.current_search_index
        ]

        self.current_page = page_number

        self.render_page()

        self.draw_search_highlight()

        self.search_result_label.configure(
            text=(
                f"{self.current_search_index + 1}"
                f" / "
                f"{len(self.search_results)}"
            )
        )

    # =========================================================
    # HIGHLIGHT
    # =========================================================

    def draw_search_highlight(self):

        if not self.search_results:
            return

        (
            page_number,
            rectangle
        ) = self.search_results[
            self.current_search_index
        ]

        if page_number != self.current_page:
            return

        if self.highlight_id is not None:

            self.canvas.delete(
                self.highlight_id
            )

        x1 = (
            self.image_x
            + rectangle.x0 * self.zoom
        )

        y1 = (
            self.image_y
            + rectangle.y0 * self.zoom
        )

        x2 = (
            self.image_x
            + rectangle.x1 * self.zoom
        )

        y2 = (
            self.image_y
            + rectangle.y1 * self.zoom
        )

        self.highlight_id = (
            self.canvas.create_rectangle(
                x1,
                y1,
                x2,
                y2,
                outline="#FF9F0A",
                width=3
            )
        )

        # Scroll menuju hasil
        bbox = self.canvas.bbox(
            self.highlight_id
        )

        if bbox:

            canvas_height = max(
                1,
                self.canvas.winfo_height()
            )

            scroll_region = (
                self.canvas.bbox("all")
            )

            if scroll_region:

                total_height = max(
                    1,
                    scroll_region[3]
                    - scroll_region[1]
                )

                target_y = max(
                    0,
                    bbox[1]
                    - canvas_height * 0.35
                )

                self.canvas.yview_moveto(
                    min(
                        1,
                        target_y
                        / total_height
                    )
                )

    # =========================================================
    # SEARCH NAVIGATION
    # =========================================================

    def next_match(self):

        if not self.search_results:

            self.search()

            return

        self.current_search_index = (
            self.current_search_index + 1
        ) % len(self.search_results)

        self.show_search_result()

    def previous_match(self):

        if not self.search_results:

            self.search()

            return

        self.current_search_index = (
            self.current_search_index - 1
        ) % len(self.search_results)

        self.show_search_result()

    # =========================================================
    # MOUSE WHEEL
    # =========================================================

    def on_mousewheel(self, event):

        self.canvas.yview_scroll(
            int(
                -1 * (event.delta / 120)
            ),
            "units"
        )

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

        self.canvas.delete(
            "all"
        )

        self.canvas.create_text(
            30,
            30,
            text=message,
            anchor="nw",
            font=("Arial", 13),
            fill="#FF3B30"
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

        if self.resize_after_id:

            try:
                self.parent.after_cancel(
                    self.resize_after_id
                )
            except Exception:
                pass

        try:

            if self.document is not None:
                self.document.close()

        except Exception:
            pass

        self.page_photo = None

        try:
            self.container.destroy()
        except Exception:
            pass


def show_pdf(file_path, parent):

    return PDFPreview(
        file_path,
        parent
    )