from tkinter import filedialog


def select_folder(initial_folder=None):
    """
    Membuka Windows folder picker.

    Args:
        initial_folder (str | None):
            Folder awal ketika dialog dibuka.

    Returns:
        str | None:
            Folder yang dipilih user.
    """

    options = {
        "title": "Pilih Folder untuk Disortir"
    }


    if initial_folder:

        options["initialdir"] = initial_folder


    folder_path = filedialog.askdirectory(
        **options
    )


    if not folder_path:

        return None


    return folder_path