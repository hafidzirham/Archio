import json
import subprocess


PYTHON = r"C:\Program Files\LibreOffice\program\python.exe"

RENDERER = (
    r"D:\Archio\src\backend\preview\presentation\renderer.py"
)

FILE = (
    r"D:\Archio\assets\presentations\test-presentation.pptx"
)


process = subprocess.Popen(
    [
        PYTHON,
        RENDERER,
    ],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=None,
    text=True,
)


def send(slide_index):

    request = {
        "command": "render",
        "filePath": FILE,
        "slideIndex": slide_index,
    }

    process.stdin.write(
        json.dumps(request) + "\n"
    )

    process.stdin.flush()

    response = process.stdout.readline()

    result = json.loads(response)

    print(
        f"SLIDE {slide_index + 1}: "
        f"{result['data']['benchmark']}"
    )


send(0)
send(1)
send(2)


process.stdin.write(
    json.dumps(
        {
            "command": "shutdown"
        }
    )
    + "\n"
)

process.stdin.flush()

process.wait()