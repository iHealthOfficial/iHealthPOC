import path from "node:path";
import { prisma } from "../db.js";
import { uploadsDir } from "../paths.js";
import { runClamScan } from "./clamScan.js";
import { runOcr } from "./ocr.js";

export async function processUploadArtifact(
  id: string,
  storageFileName: string,
  mimeType: string,
): Promise<void> {
  const absPath = path.resolve(uploadsDir, storageFileName);
  if (!absPath.startsWith(path.resolve(uploadsDir))) return;

  const scan = await runClamScan(absPath);
  await prisma.uploadArtifact.update({
    where: { id },
    data: {
      scanStatus: scan.status,
      scanMessage: scan.message ?? null,
    },
  });

  if (scan.status === "infected") {
    await prisma.uploadArtifact.update({
      where: { id },
      data: {
        ocrStatus: "skipped",
        ocrMessage: "OCR skipped: malware scan flagged this file.",
      },
    });
    return;
  }

  const ocr = await runOcr(absPath, mimeType);
  const ocrStatus =
    ocr.status === "done" ? "done" : ocr.status === "skipped" ? "skipped" : "error";
  await prisma.uploadArtifact.update({
    where: { id },
    data: {
      ocrStatus,
      ocrMessage: ocr.message ?? null,
      ocrText: ocr.status === "done" ? ocr.text : null,
    },
  });
}
