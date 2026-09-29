import os
import ctypes
from ctypes import wintypes


# =========================================================
# WINDOWS FILE OPERATION
# =========================================================

FO_DELETE = 0x0003

FOF_SILENT = 0x0004
FOF_NOCONFIRMATION = 0x0010
FOF_ALLOWUNDO = 0x0040
FOF_NOERRORUI = 0x0400


class SHFILEOPSTRUCTW(ctypes.Structure):

    _fields_ = [
        ("hwnd", wintypes.HWND),
        ("wFunc", wintypes.UINT),
        ("pFrom", wintypes.LPCWSTR),
        ("pTo", wintypes.LPCWSTR),
        ("fFlags", wintypes.WORD),
        ("fAnyOperationsAborted", wintypes.BOOL),
        ("hNameMappings", wintypes.LPVOID),
        ("lpszProgressTitle", wintypes.LPCWSTR),
    ]


def move_to_recycle_bin(file_path):
    """
    Memindahkan file ke Windows Recycle Bin.

    Menggunakan Windows Shell API langsung,
    bukan menghapus file secara permanen.

    Returns:
        tuple:
            (success, message)
    """

    if not os.path.isfile(file_path):

        return (
            False,
            "File tidak ditemukan."
        )


    # Pastikan absolute path
    file_path = os.path.abspath(
        file_path
    )


    # Windows SHFileOperation membutuhkan
    # double-null terminated string.
    source = (
        file_path
        + "\0\0"
    )


    operation = SHFILEOPSTRUCTW()

    operation.hwnd = None

    operation.wFunc = FO_DELETE

    operation.pFrom = source

    operation.pTo = None

    operation.fFlags = (
        FOF_ALLOWUNDO
        | FOF_NOCONFIRMATION
        | FOF_SILENT
        | FOF_NOERRORUI
    )

    operation.fAnyOperationsAborted = False

    operation.hNameMappings = None

    operation.lpszProgressTitle = None


    try:

        result = ctypes.windll.shell32.SHFileOperationW(
            ctypes.byref(operation)
        )


        # 0 = berhasil
        if result == 0:

            return (
                True,
                "File dipindahkan ke Recycle Bin."
            )


        # Operasi dibatalkan
        if operation.fAnyOperationsAborted:

            return (
                False,
                "Operasi pemindahan dibatalkan."
            )


        return (
            False,
            f"Windows gagal memindahkan file. "
            f"Error code: {result}"
        )


    except Exception as error:

        return (
            False,
            str(error)
        )