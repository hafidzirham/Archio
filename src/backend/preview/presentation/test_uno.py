import subprocess
import time
from pathlib import Path

import uno


LIBREOFFICE = r"C:\Program Files\LibreOffice\program\soffice.exe"

PRESENTATION = Path(
    r"D:\Archio\assets\presentations\test-presentation.pptx"
)

OUTPUT = Path(
    r"D:\Archio\assets\presentations\test-slide.png"
)


# --------------------------------------------------
# Start LibreOffice
# --------------------------------------------------

subprocess.Popen(
    [
        LIBREOFFICE,
        "--headless",
        "--invisible",
        "--norestore",
        "--nodefault",
        "--nofirststartwizard",
        "--accept=socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext",
    ],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
    creationflags=subprocess.CREATE_NO_WINDOW,
)

print("LibreOffice starting...")

time.sleep(2)


# --------------------------------------------------
# Connect UNO
# --------------------------------------------------

local_context = uno.getComponentContext()

resolver = local_context.ServiceManager.createInstanceWithContext(
    "com.sun.star.bridge.UnoUrlResolver",
    local_context,
)

context = resolver.resolve(
    "uno:socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext"
)

print("UNO CONNECTED")


# --------------------------------------------------
# Desktop
# --------------------------------------------------

desktop = context.ServiceManager.createInstanceWithContext(
    "com.sun.star.frame.Desktop",
    context,
)

print("DESKTOP OK")


# --------------------------------------------------
# Open presentation
# --------------------------------------------------

input_url = uno.systemPathToFileUrl(
    str(PRESENTATION)
)

print("Opening presentation...")

start = time.perf_counter()

document = desktop.loadComponentFromURL(
    input_url,
    "_blank",
    0,
    (),
)

load_time = time.perf_counter() - start

print(f"LOAD: {load_time:.3f}s")


if document is None:
    raise RuntimeError(
        "LibreOffice gagal membuka presentation."
    )


# --------------------------------------------------
# Get first slide
# --------------------------------------------------

pages = document.getDrawPages()

print(f"TOTAL SLIDES: {pages.getCount()}")

slide = pages.getByIndex(0)

document_controller = document.getCurrentController()

document_controller.setCurrentPage(slide)

print("FIRST SLIDE READY")


# --------------------------------------------------
# Export current slide as PNG
# --------------------------------------------------

print("Exporting slide to PNG...")

output_url = uno.systemPathToFileUrl(
    str(OUTPUT)
)

start = time.perf_counter()

filter_property = uno.createUnoStruct(
    "com.sun.star.beans.PropertyValue"
)

filter_property.Name = "FilterName"
filter_property.Value = "impress_png_Export"

document.storeToURL(
    output_url,
    (filter_property,),
)

export_time = time.perf_counter() - start

print(f"EXPORT: {export_time:.3f}s")


# --------------------------------------------------
# Close
# --------------------------------------------------

document.close(True)


# --------------------------------------------------
# Result
# --------------------------------------------------

print(f"PNG EXISTS: {OUTPUT.exists()}")

if OUTPUT.exists():
    print(
        f"PNG SIZE: {OUTPUT.stat().st_size / 1024:.1f} KB"
    )

print("DONE")