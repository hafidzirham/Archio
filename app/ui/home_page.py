import customtkinter as ctk


class HomePage(ctk.CTkFrame):

    def __init__(
        self,
        parent,
        on_start
    ):
        super().__init__(
            parent,
            fg_color="#F7F7F7",
            corner_radius=0
        )

        self.on_start = on_start

        self.create_ui()


    # =====================================================
    # CREATE UI
    # =====================================================

    def create_ui(self):

        # -------------------------------------------------
        # TITLE
        # -------------------------------------------------

        title_label = ctk.CTkLabel(
            self,
            text="SORTIR FILE",
            font=ctk.CTkFont(
                family="Arial",
                size=42,
                weight="bold"
            ),
            text_color="#111111"
        )

        title_label.place(
            relx=0.5,
            rely=0.37,
            anchor="center"
        )


        # -------------------------------------------------
        # DESCRIPTION
        # -------------------------------------------------

        description_label = ctk.CTkLabel(
            self,
            text="Rapikan file dengan cepat dan mudah.",
            font=ctk.CTkFont(
                family="Arial",
                size=16
            ),
            text_color="#666666"
        )

        description_label.place(
            relx=0.5,
            rely=0.46,
            anchor="center"
        )


        # -------------------------------------------------
        # START BUTTON
        # -------------------------------------------------

        start_button = ctk.CTkButton(
            self,
            text="Mulai Sortir",
            width=220,
            height=55,
            corner_radius=12,
            font=ctk.CTkFont(
                family="Arial",
                size=17,
                weight="bold"
            ),
            fg_color="#2563EB",
            hover_color="#1D4ED8",
            text_color="#FFFFFF",
            command=self.on_start
        )

        start_button.place(
            relx=0.5,
            rely=0.58,
            anchor="center"
        )


        # -------------------------------------------------
        # FOOTER
        # -------------------------------------------------

        footer_label = ctk.CTkLabel(
            self,
            text="File Shorter",
            font=ctk.CTkFont(
                family="Arial",
                size=12
            ),
            text_color="#999999"
        )

        footer_label.place(
            relx=0.5,
            rely=0.92,
            anchor="center"
        )