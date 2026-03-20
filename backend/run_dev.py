"""Development launcher that uses the current Python interpreter.

On some Windows setups, running ``uvicorn`` directly picks up a global
installation instead of the project's virtualenv executable. Running this file
with ``python run_dev.py`` or ``python -m uvicorn`` avoids that mismatch.
"""

import uvicorn


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
