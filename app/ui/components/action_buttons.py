import customtkinter as ctk


class ActionButtons(ctk.CTkFrame):

    def __init__(
        self,
        parent,
        on_keep,
        on_move,
        on_delete
    ):
        super().__init__(
            parent,
            fg_color="transparent"
        )

        self.on_keep = on_keep
        self.on_move = on_move
        self.on_delete = on_delete

        self.create_ui()


    def create_ui(self):

        self.keep_button = ctk.CTkButton(
            self,
            text="Keep",
            width=130,
            height=45,
            corner_radius=10,
            fg_color="#16A34A",
            hover_color="#15803D",
            text_color="#FFFFFF",
            command=self.on_keep
        )

        self.keep_button.pack(
            side="left",
            padx=6
        )


        self.move_button = ctk.CTkButton(
            self,
            text="Move",
            width=130,
            height=45,
            corner_radius=10,
            fg_color="#2563EB",
            hover_color="#1D4ED8",
            text_color="#FFFFFF",
            command=self.on_move
        )

        self.move_button.pack(
            side="left",
            padx=6
        )


        self.delete_button = ctk.CTkButton(
            self,
            text="Delete",
            width=130,
            height=45,
            corner_radius=10,
            fg_color="#DC2626",
            hover_color="#B91C1C",
            text_color="#FFFFFF",
            command=self.on_delete
        )

        self.delete_button.pack(
            side="left",
            padx=6
        )