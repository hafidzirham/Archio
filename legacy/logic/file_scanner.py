import os


def scan_files(folder_path):
    """
    Mengambil semua file yang berada langsung
    di dalam folder yang dipilih.

    Args:
        folder_path (str):
            Path folder yang akan dipindai.

    Returns:
        list[str]:
            Daftar path lengkap setiap file.
    """

    files = []

    if not os.path.isdir(folder_path):
        return files

    try:
        for filename in os.listdir(folder_path):

            file_path = os.path.join(
                folder_path,
                filename
            )

            if os.path.isfile(file_path):
                files.append(file_path)

    except PermissionError:
        return files

    return files