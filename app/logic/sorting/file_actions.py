import os

from app.logic.sorting.move_handler import move_file
from app.logic.sorting.recycle_bin import move_to_recycle_bin


def keep_file(file_path):
    """
    Keep tidak melakukan perubahan terhadap file.
    """

    if not os.path.isfile(file_path):

        return (
            False,
            "File tidak ditemukan."
        )

    return (
        True,
        "File tetap di tempat."
    )


def move_file_action(
    file_path,
    destination_folder
):
    """
    Memindahkan file ke folder tujuan.
    """

    return move_file(
        file_path,
        destination_folder
    )


def delete_file(file_path):
    """
    Memindahkan file ke Recycle Bin.
    """

    return move_to_recycle_bin(
        file_path
    )