import customtkinter as ctk


class NavigationBar(ctk.CTkFrame):

    def __init__(
        self,
        parent,
        on_previous,
        on_next
    ):
        super().__init__(
            parent,
            fg_color="transparent"
        )

        self.on_previous = on_previous
        self.on_next = on_next

        self.create_ui()

    def create_ui(self):

        self.previous_button = ctk.CTkButton(
            self,
            text="← Previous",
            width=120,
            height=40,
            corner_radius=10,
            fg_color="#E5E7EB",
            hover_color="#D1D5DB",
            text_color="#111111",
            command=self.on_previous
        )

        self.previous_button.pack(
            side="left",
            padx=10
        )


        self.file_counter = ctk.CTkLabel(
            self,
            text="0 / 0",
            font=ctk.CTkFont(
                family="Arial",
                size=15,
                weight="bold"
            ),
            text_color="#444444"
        )

        self.file_counter.pack(
            side="left",
            padx=20
        )


        self.next_button = ctk.CTkButton(
            self,
            text="Next →",
            width=120,
            height=40,
            corner_radius=10,
            fg_color="#E5E7EB",
            hover_color="#D1D5DB",
            text_color="#111111",
            command=self.on_next
        )

        self.next_button.pack(
            side="left",
            padx=10
        )


    def update_counter(
        self,
        current_index,
        total_files
    ):

        if total_files == 0:

            self.file_counter.configure(
                text="0 / 0"
            )

            return

        self.file_counter.configure(
            text=f"{current_index + 1} / {total_files}"
        )


    def update_button_state(
        self,
        current_index,
        total_files
    ):

        if total_files == 0:

            self.previous_button.configure(
                state="disabled"
            )

            self.next_button.configure(
                state="disabled"
            )

            return


        if current_index <= 0:

            self.previous_button.configure(
                state="disabled"
            )

        else:

            self.previous_button.configure(
                state="normal"
            )


        if current_index >= total_files - 1:

            self.next_button.configure(
                state="disabled"
            )

        else:

            self.next_button.configure(
                state="normal"
            )