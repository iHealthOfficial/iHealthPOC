# Local scan & OCR (free, on your machine)

After each upload, the API:

1. **Malware scan** — runs **`clamscan`** if ClamAV is installed (common paths on Windows + `PATH` on Linux/macOS). If not found, `scanStatus` is **`skipped`**.
2. **Text / OCR** — **`tesseract.js`** for raster images (`image/png`, `jpeg`, `webp`, …); **`pdf-parse`** for PDFs that already contain a text layer. Image-only PDFs are **`skipped`** with a note (rasterizing PDF pages is not in this POC).

## Apply DB changes

New columns on `UploadArtifact` store `scanStatus`, `ocrStatus`, and `ocrText`. Run:

```bash
npm run db:migrate
```

## Install npm dependencies

From repo root:

```bash
npm install
```

Adds **`tesseract.js`** and **`pdf-parse`** to the API workspace.

## ClamAV (optional)

- **Windows:** [ClamAV for Windows](https://www.clamav.net/) — install so `clamscan.exe` exists (default paths under `Program Files\ClamAV` are detected).
- **Linux:** `sudo apt install clamav` (then update virus definitions: `sudo freshclam`).

## Tesseract.js notes

- First run may **download** the English model; it is **cached** for later (often under user cache dirs).
- Large images can take time and memory; the upload limit is still **25 MB**.

## PDFs

- Digital PDFs with selectable text: text is extracted **without** OCR.
- Scanned PDFs: use **PNG/JPEG** exports for OCR in this version, or extend the server later (e.g. render pages to images, then Tesseract).
