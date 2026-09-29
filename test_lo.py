import subprocess
import time

soffice = r"C:\Program Files\LibreOffice\program\soffice.exe"

print("Starting...")

start = time.perf_counter()

result = subprocess.run(
    [
        soffice,
        "--headless",
        "--version",
    ],
    capture_output=True,
    text=True,
)

elapsed = time.perf_counter() - start

print()
print("Return code:", result.returncode)
print("Elapsed:", elapsed)
print("Elapsed ms:", elapsed * 1000)

print()
print("STDOUT:")
print(result.stdout)

print()
print("STDERR:")
print(result.stderr)