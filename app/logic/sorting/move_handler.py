import os
import shutil


def move_file(file_path, destination_folder):
    """
    Memindahkan file ke folder tujuan.

    Args:
        file_path (str):
            Path file yang akan dipindahkan.

        destination_folder (str):
            Folder tujuan.

    Returns:
        tuple:
            (success, result)

            success:
                True jika berhasil.

            result:
                Path file baru atau pesan error.
    """

    if not os.path.isfile(file_path):

        return (
            False,
            "File tidak ditemukan."
        )


    if not os.path.isdir(destination_folder):

        return (
            False,
            "Folder tujuan tidak ditemukan."
        )


    source_folder = os.path.dirname(
        os.path.abspath(file_path)
    )

    destination_folder = os.path.abspath(
        destination_folder
    )


    # Jangan memindahkan ke folder yang sama
    if source_folder == destination_folder:

        return (
            False,
            "File sudah berada di folder tersebut."
        )


    try:

        new_path = shutil.move(
            file_path,
            destination_folder
        )

        return (
            True,
            new_path
        )

    except Exception as error:

        return (
            False,
            str(error)
        )