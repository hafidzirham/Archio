import tkinter as tk

import customtkinter as ctk

from PIL import Image, ImageTk, ImageOps


class ImagePreview:

    def __init__(
        self,
        file_path,
        parent
    ):

        self.file_path = file_path
        self.parent = parent

        # =====================================================
        # CONTAINER
        # =====================================================

        self.container = ctk.CTkFrame(
            parent,
            fg_color="#F5F5F7",
            corner_radius=0
        )

        self.container.pack(
            fill="both",
            expand=True
        )

        # =====================================================
        # STATE
        # =====================================================

        self.destroyed = False

        self.original_image = None
        self.photo = None

        # =====================================================
        # ZOOM
        # =====================================================

        self.zoom = 1.0

        # Minimum 10%
        self.min_zoom = 0.10

        # Maximum 200%
        self.max_zoom = 2.00

        # Naik/turun 10% setiap klik
        self.zoom_step = 0.10

        self.fit_zoom = 1.0

        # =====================================================
        # RESIZE
        # =====================================================

        self.render_after_id = None

        # =====================================================
        # PAN / DRAG
        # =====================================================

        self.is_panning = False

        # =====================================================
        # SCROLLBAR STATE
        # =====================================================

        self.horizontal_visible = False
        self.vertical_visible = False

        # =====================================================
        # UI
        # =====================================================

        self.create_ui()

        # =====================================================
        # LOAD IMAGE
        # =====================================================

        self.load_image()

    # =========================================================
    # UI
    # =========================================================

    def create_ui(self):

        # =====================================================
        # HEADER
        # =====================================================

        self.title_label = ctk.CTkLabel(
            self.container,
            text="Image Preview",
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

        # =====================================================
        # TOOLBAR AREA
        # =====================================================

        toolbar_area = ctk.CTkFrame(
            self.container,
            fg_color="transparent"
        )

        toolbar_area.pack(
            fill="x",
            padx=20,
            pady=(0, 10)
        )

        # =====================================================
        # TOOLBAR
        # =====================================================

        self.toolbar = ctk.CTkFrame(
            toolbar_area,
            fg_color="#FFFFFF",
            corner_radius=14,
            height=50
        )

        self.toolbar.pack(
            anchor="center"
        )

        # =====================================================
        # ZOOM GROUP
        # =====================================================

        self.zoom_group = ctk.CTkFrame(
            self.toolbar,
            fg_color="#F2F2F7",
            corner_radius=10
        )

        self.zoom_group.pack(
            side="left",
            padx=6,
            pady=7
        )

        # =====================================================
        # ZOOM OUT
        # =====================================================

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

        # =====================================================
        # ZOOM LABEL
        # =====================================================

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

        # =====================================================
        # ZOOM IN
        # =====================================================

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

        # =====================================================
        # FIT
        # =====================================================

        self.fit_button = ctk.CTkButton(
            self.toolbar,
            text="Fit",
            width=55,
            height=32,
            corner_radius=9,
            fg_color="#F2F2F7",
            hover_color="#E5E5EA",
            text_color="#1D1D1F",
            font=ctk.CTkFont(
                size=11
            ),
            command=self.fit_to_screen
        )

        self.fit_button.pack(
            side="left",
            padx=(2, 4),
            pady=7
        )

        # =====================================================
        # 100%
        # =====================================================

        self.reset_button = ctk.CTkButton(
            self.toolbar,
            text="100%",
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

        self.reset_button.pack(
            side="left",
            padx=(2, 6),
            pady=7
        )

        # =====================================================
        # VIEWER
        # =====================================================

        self.viewer_frame = ctk.CTkFrame(
            self.container,
            fg_color="#E5E5EA",
            corner_radius=14
        )

        self.viewer_frame.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=(0, 18)
        )

        # =====================================================
        # CANVAS
        # =====================================================

        self.canvas = tk.Canvas(
            self.viewer_frame,
            bg="#E5E5EA",
            highlightthickness=0,
            bd=0
        )

        self.canvas.place(
            x=0,
            y=0,
            relwidth=1,
            relheight=1
        )

        # =====================================================
        # VERTICAL SCROLLBAR
        # =====================================================

        self.scrollbar_y = ctk.CTkScrollbar(
            self.viewer_frame,
            orientation="vertical",
            command=self.canvas.yview,
            width=10
        )

        # =====================================================
        # HORIZONTAL SCROLLBAR
        # =====================================================

        self.scrollbar_x = ctk.CTkScrollbar(
            self.viewer_frame,
            orientation="horizontal",
            command=self.canvas.xview,
            height=10
        )

        # =====================================================
        # CANVAS SCROLL COMMAND
        # =====================================================

        self.canvas.configure(
            yscrollcommand=self.scrollbar_y.set,
            xscrollcommand=self.scrollbar_x.set
        )

        # =====================================================
        # MOUSE WHEEL
        # =====================================================

        self.canvas.bind(
            "<MouseWheel>",
            self.on_mousewheel
        )

        # =====================================================
        # SHIFT + MOUSE WHEEL
        # =====================================================

        self.canvas.bind(
            "<Shift-MouseWheel>",
            self.on_shift_mousewheel
        )

        # =====================================================
        # PAN / DRAG
        # =====================================================

        self.canvas.bind(
            "<ButtonPress-1>",
            self.start_pan
        )

        self.canvas.bind(
            "<B1-Motion>",
            self.pan_image
        )

        self.canvas.bind(
            "<ButtonRelease-1>",
            self.end_pan
        )

        # =====================================================
        # CURSOR
        # =====================================================

        self.canvas.bind(
            "<Enter>",
            self.on_canvas_enter
        )

        self.canvas.bind(
            "<Leave>",
            self.on_canvas_leave
        )

        # =====================================================
        # RESIZE
        # =====================================================

        self.canvas.bind(
            "<Configure>",
            self.on_canvas_resize
        )

        # =====================================================
        # LOADING
        # =====================================================

        self.loading_label = ctk.CTkLabel(
            self.canvas,
            text="Menyiapkan preview...",
            font=ctk.CTkFont(
                family="Arial",
                size=13
            ),
            text_color="#6E6E73"
        )

        self.loading_label.place(
            relx=0.5,
            rely=0.5,
            anchor="center"
        )

    # =========================================================
    # LOAD IMAGE
    # =========================================================

    def load_image(self):

        try:

            image = Image.open(
                self.file_path
            )

            # =================================================
            # EXIF ORIENTATION
            # =================================================

            image = ImageOps.exif_transpose(
                image
            )

            # =================================================
            # FORCE LOAD
            # =================================================

            image.load()

            # =================================================
            # CONVERT
            # =================================================

            if image.mode in (
                "RGBA",
                "LA"
            ):

                image = image.convert(
                    "RGBA"
                )

            else:

                image = image.convert(
                    "RGB"
                )

            self.original_image = image

            # =================================================
            # REMOVE LOADING
            # =================================================

            try:

                self.loading_label.destroy()

            except Exception:
                pass

            # =================================================
            # INITIAL FIT
            # =================================================

            self.parent.after(
                100,
                self.fit_to_screen
            )

        except Exception as error:

            self.show_error(
                str(error)
            )

    # =========================================================
    # GET CANVAS SIZE
    # =========================================================

    def get_canvas_size(self):

        width = self.canvas.winfo_width()
        height = self.canvas.winfo_height()

        if width <= 1:
            width = 900

        if height <= 1:
            height = 500

        return width, height

    # =========================================================
    # CALCULATE FIT
    # =========================================================

    def calculate_fit_zoom(self):

        if self.original_image is None:

            return 1.0

        canvas_width, canvas_height = (
            self.get_canvas_size()
        )

        # =====================================================
        # PADDING
        # =====================================================

        padding = 40

        available_width = max(
            100,
            canvas_width - padding
        )

        available_height = max(
            100,
            canvas_height - padding
        )

        image_width = (
            self.original_image.width
        )

        image_height = (
            self.original_image.height
        )

        if image_width <= 0:
            return 1.0

        if image_height <= 0:
            return 1.0

        # =====================================================
        # ASPECT RATIO
        # =====================================================

        width_ratio = (
            available_width
            / image_width
        )

        height_ratio = (
            available_height
            / image_height
        )

        fit = min(
            width_ratio,
            height_ratio
        )

        # =====================================================
        # IMPORTANT
        #
        # FIT TIDAK BOLEH MEMPERBESAR GAMBAR
        # KECIL DI ATAS 100%.
        #
        # Contoh:
        #
        # image kecil:
        # Fit = 100%
        #
        # image besar:
        # Fit = 32%
        # =====================================================

        fit = min(
            fit,
            1.0
        )

        # =====================================================
        # MINIMUM
        # =====================================================

        fit = max(
            fit,
            self.min_zoom
        )

        return round(
            fit,
            3
        )

    # =========================================================
    # FIT TO SCREEN
    # =========================================================

    def fit_to_screen(self):

        if self.original_image is None:

            return

        self.fit_zoom = (
            self.calculate_fit_zoom()
        )

        self.zoom = self.fit_zoom

        self.render_image(
            center=True
        )

    # =========================================================
    # RENDER IMAGE
    # =========================================================

    def render_image(
        self,
        center=False
    ):

        if self.destroyed:

            return

        if self.original_image is None:

            return

        canvas_width, canvas_height = (
            self.get_canvas_size()
        )

        # =====================================================
        # DISPLAY SIZE
        #
        # X DAN Y SELALU MENGGUNAKAN ZOOM YANG SAMA.
        #
        # ASPECT RATIO TIDAK AKAN RUSAK.
        # =====================================================

        width = max(
            1,
            int(
                self.original_image.width
                * self.zoom
            )
        )

        height = max(
            1,
            int(
                self.original_image.height
                * self.zoom
            )
        )

        # =====================================================
        # RESIZE
        # =====================================================

        if (
            width == self.original_image.width
            and
            height == self.original_image.height
        ):

            rendered = self.original_image

        else:

            rendered = self.original_image.resize(
                (
                    width,
                    height
                ),
                Image.Resampling.LANCZOS
            )

        # =====================================================
        # KEEP PHOTO REFERENCE
        # =====================================================

        self.photo = ImageTk.PhotoImage(
            rendered
        )

        # =====================================================
        # CLEAR CANVAS
        # =====================================================

        self.canvas.delete(
            "all"
        )

        # =====================================================
        # DETECT OVERFLOW
        # =====================================================

        horizontal_needed = (
            width > canvas_width
        )

        vertical_needed = (
            height > canvas_height
        )

        # =====================================================
        # SCROLL REGION
        # =====================================================

        if horizontal_needed:

            region_width = (
                width + 40
            )

        else:

            region_width = canvas_width

        if vertical_needed:

            region_height = (
                height + 40
            )

        else:

            region_height = canvas_height

        self.canvas.configure(
            scrollregion=(
                0,
                0,
                region_width,
                region_height
            )
        )

        # =====================================================
        # POSITION
        # =====================================================

        if horizontal_needed:

            image_x = 20

        else:

            image_x = (
                canvas_width - width
            ) / 2

        if vertical_needed:

            image_y = 20

        else:

            image_y = (
                canvas_height - height
            ) / 2

        image_x = int(
            image_x
        )

        image_y = int(
            image_y
        )

        # =====================================================
        # DRAW
        # =====================================================

        self.canvas.create_image(
            image_x,
            image_y,
            image=self.photo,
            anchor="nw"
        )

        # =====================================================
        # UPDATE SCROLLBARS
        # =====================================================

        self.update_scrollbars(
            horizontal_needed,
            vertical_needed
        )

        # =====================================================
        # UPDATE ZOOM LABEL
        # =====================================================

        self.zoom_label.configure(
            text=f"{round(self.zoom * 100)}%"
        )

        # =====================================================
        # CENTER VIEW
        # =====================================================

        if center:

            self.parent.after(
                10,
                self.center_view
            )

        else:

            if not horizontal_needed:

                self.canvas.xview_moveto(
                    0
                )

            if not vertical_needed:

                self.canvas.yview_moveto(
                    0
                )

    # =========================================================
    # UPDATE SCROLLBARS
    # =========================================================

    def update_scrollbars(
        self,
        horizontal_needed,
        vertical_needed
    ):

        # =====================================================
        # HORIZONTAL
        # =====================================================

        if horizontal_needed:

            self.scrollbar_x.place(
                relx=0.5,
                rely=1.0,
                relwidth=0.92,
                anchor="s",
                y=-6
            )

            self.horizontal_visible = True

        else:

            self.scrollbar_x.place_forget()

            self.horizontal_visible = False

            self.canvas.xview_moveto(
                0
            )

        # =====================================================
        # VERTICAL
        # =====================================================

        if vertical_needed:

            self.scrollbar_y.place(
                relx=1.0,
                rely=0.5,
                relheight=0.92,
                anchor="e",
                x=-6
            )

            self.vertical_visible = True

        else:

            self.scrollbar_y.place_forget()

            self.vertical_visible = False

            self.canvas.yview_moveto(
                0
            )

        # =====================================================
        # CURSOR
        # =====================================================

        if (
            horizontal_needed
            or
            vertical_needed
        ):

            self.canvas.configure(
                cursor="hand2"
            )

        else:

            self.canvas.configure(
                cursor="arrow"
            )

    # =========================================================
    # CENTER VIEW
    # =========================================================

    def center_view(self):

        if self.original_image is None:

            return

        canvas_width, canvas_height = (
            self.get_canvas_size()
        )

        image_width = int(
            self.original_image.width
            * self.zoom
        )

        image_height = int(
            self.original_image.height
            * self.zoom
        )

        # =====================================================
        # HORIZONTAL
        # =====================================================

        if image_width > canvas_width:

            self.canvas.xview_moveto(
                0.5
            )

        else:

            self.canvas.xview_moveto(
                0
            )

        # =====================================================
        # VERTICAL
        # =====================================================

        if image_height > canvas_height:

            self.canvas.yview_moveto(
                0.5
            )

        else:

            self.canvas.yview_moveto(
                0
            )

    # =========================================================
    # ZOOM IN
    # =========================================================

    def zoom_in(self):

        if self.original_image is None:

            return

        new_zoom = round(
            self.zoom + self.zoom_step,
            2
        )

        # =====================================================
        # MAXIMUM 200%
        # =====================================================

        new_zoom = min(
            new_zoom,
            self.max_zoom
        )

        if new_zoom == self.zoom:

            return

        self.zoom = new_zoom

        self.render_image(
            center=True
        )

    # =========================================================
    # ZOOM OUT
    # =========================================================

    def zoom_out(self):

        if self.original_image is None:

            return

        new_zoom = round(
            self.zoom - self.zoom_step,
            2
        )

        # =====================================================
        # MINIMUM 10%
        # =====================================================

        new_zoom = max(
            new_zoom,
            self.min_zoom
        )

        if new_zoom == self.zoom:

            return

        self.zoom = new_zoom

        self.render_image(
            center=True
        )

    # =========================================================
    # RESET 100%
    # =========================================================

    def reset_zoom(self):

        if self.original_image is None:

            return

        self.zoom = 1.0

        self.render_image(
            center=True
        )

    # =========================================================
    # RESIZE
    # =========================================================

    def on_canvas_resize(
        self,
        event
    ):

        if self.original_image is None:

            return

        if self.render_after_id:

            try:

                self.parent.after_cancel(
                    self.render_after_id
                )

            except Exception:
                pass

        self.render_after_id = (
            self.parent.after(
                120,
                self.handle_resize
            )
        )

    # =========================================================
    # HANDLE RESIZE
    # =========================================================

    def handle_resize(self):

        if self.destroyed:

            return

        self.render_after_id = None

        if self.original_image is None:

            return

        # =====================================================
        # WINDOW RESIZE
        #
        # KEMBALI KE FIT SUPAYA RESPONSIVE.
        # =====================================================

        self.fit_to_screen()

    # =========================================================
    # START PAN
    # =========================================================

    def start_pan(
        self,
        event
    ):

        if self.destroyed:

            return

        # =====================================================
        # PAN HANYA KALAU IMAGE LEBIH BESAR
        # DARI VIEWER.
        # =====================================================

        if not (
            self.horizontal_visible
            or
            self.vertical_visible
        ):

            return

        self.is_panning = True

        self.canvas.scan_mark(
            event.x,
            event.y
        )

        self.canvas.configure(
            cursor="hand2"
        )

    # =========================================================
    # PAN IMAGE
    # =========================================================

    def pan_image(
        self,
        event
    ):

        if self.destroyed:

            return

        if not self.is_panning:

            return

        self.canvas.scan_dragto(
            event.x,
            event.y,
            gain=1
        )

    # =========================================================
    # END PAN
    # =========================================================

    def end_pan(
        self,
        event
    ):

        if self.destroyed:

            return

        self.is_panning = False

        if (
            self.horizontal_visible
            or
            self.vertical_visible
        ):

            self.canvas.configure(
                cursor="hand2"
            )

        else:

            self.canvas.configure(
                cursor="arrow"
            )

    # =========================================================
    # CURSOR ENTER
    # =========================================================

    def on_canvas_enter(
        self,
        event
    ):

        if self.destroyed:

            return

        if (
            self.horizontal_visible
            or
            self.vertical_visible
        ):

            self.canvas.configure(
                cursor="hand2"
            )

        else:

            self.canvas.configure(
                cursor="arrow"
            )

    # =========================================================
    # CURSOR LEAVE
    # =========================================================

    def on_canvas_leave(
        self,
        event
    ):

        if self.destroyed:

            return

        if not self.is_panning:

            self.canvas.configure(
                cursor="arrow"
            )

    # =========================================================
    # MOUSE WHEEL
    # =========================================================

    def on_mousewheel(
        self,
        event
    ):

        if not self.vertical_visible:

            return

        if event.delta == 0:

            return

        self.canvas.yview_scroll(
            int(
                -event.delta / 120
            ),
            "units"
        )

    # =========================================================
    # SHIFT + MOUSE WHEEL
    # =========================================================

    def on_shift_mousewheel(
        self,
        event
    ):

        if not self.horizontal_visible:

            return

        if event.delta == 0:

            return

        self.canvas.xview_scroll(
            int(
                -event.delta / 120
            ),
            "units"
        )

    # =========================================================
    # ERROR
    # =========================================================

    def show_error(
        self,
        message
    ):

        if self.destroyed:

            return

        try:

            self.loading_label.destroy()

        except Exception:
            pass

        self.canvas.delete(
            "all"
        )

        self.canvas.create_text(
            30,
            30,
            text=(
                "Gagal menampilkan image.\n\n"
                + message
            ),
            anchor="nw",
            font=(
                "Arial",
                13
            ),
            fill="#FF3B30"
        )

    # =========================================================
    # CLEANUP
    # =========================================================

    def destroy(self):

        self.destroyed = True

        self.is_panning = False

        # =====================================================
        # CANCEL RESIZE
        # =====================================================

        if self.render_after_id:

            try:

                self.parent.after_cancel(
                    self.render_after_id
                )

            except Exception:
                pass

        self.render_after_id = None

        # =====================================================
        # RELEASE IMAGE
        # =====================================================

        self.photo = None
        self.original_image = None

        # =====================================================
        # DESTROY CONTAINER
        # =====================================================

        try:

            self.container.destroy()

        except Exception:
            pass


# =============================================================
# PUBLIC FUNCTION
# =============================================================

def show_image(
    file_path,
    parent
):

    return ImagePreview(
        file_path,
        parent
    )