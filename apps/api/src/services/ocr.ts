import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

export type OcrResult =
  | { status: "done"; text: string; message?: string }
  | { status: "skipped"; message?: string }
  | { status: "error"; message?: string };

const IMAGE_MIME = /^image\/(png|jpeg|jpg|webp|gif|bmp|tiff)$/i;

async function ocrImage(filePath: string): Promise<OcrResult> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const {
        data: { text },
      } = await worker.recognize(filePath);
      const trimmed = text.trim();
      return {
        status: "done",
        text: trimmed,
        message: trimmed ? undefined : "No text recognized (try a clearer scan)",
      };
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

async function extractPdfText(filePath: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const { text } = await pdfParse(buf);
  return text?.trim() ?? "";
}

export async function runOcr(filePath: string, mimeType: string): Promise<OcrResult> {
  const mime = mimeType.toLowerCase().split(";")[0].trim();

  if (mime === "text/plain" || mime === "text/csv") {
    try {
      const text = fs.readFileSync(filePath, "utf-8").trim();
      return {
        status: "done",
        text,
        message: text ? undefined : "Empty text file",
      };
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : String(err) };
    }
  }

  if (mime === "application/pdf") {
    try {
      const text = await extractPdfText(filePath);
      if (text.length > 0) {
        return { status: "done", text, message: "Extracted embedded text (not OCR). Scanned PDFs may need a raster OCR step." };
      }
      return {
        status: "skipped",
        message:
          "No embedded text in PDF (likely image-only). Use PNG/JPEG for Tesseract OCR in this POC, or add pdf→image rasterization later.",
      };
    } catch (err) {
      return {
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  if (IMAGE_MIME.test(mime)) {
    return ocrImage(filePath);
  }

  return {
    status: "skipped",
    message: `OCR not run for MIME type ${mime}. Supported: images (png, jpeg, webp, …), application/pdf (text layer), text/plain.`,
  };
}
