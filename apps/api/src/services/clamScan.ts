import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ScanResult =
  | { status: "clean"; message?: string }
  | { status: "infected"; message?: string }
  | { status: "skipped"; message?: string }
  | { status: "error"; message?: string };

function candidateBins(): string[] {
  const list: string[] = [];
  if (process.platform === "win32") {
    list.push(
      "C:\\Program Files\\ClamAV\\clamscan.exe",
      "C:\\Program Files (x86)\\ClamAV\\clamscan.exe",
    );
  }
  list.push("clamscan");
  return list;
}

async function tryClamScan(bin: string, filePath: string): Promise<ScanResult | "try_next"> {
  if (bin.includes("\\") || bin.includes("/")) {
    if (!fs.existsSync(bin)) return "try_next";
  }
  try {
    await execFileAsync(bin, ["--no-summary", filePath], {
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { status: "clean" };
  } catch (err: unknown) {
    const e = err as { code?: number; stderr?: Buffer; message?: string };
    if (e.code === 1) {
      return {
        status: "infected",
        message: e.stderr?.toString("utf-8").trim() || "ClamAV reported an issue with this file",
      };
    }
    return "try_next";
  }
}

export async function runClamScan(filePath: string): Promise<ScanResult> {
  for (const bin of candidateBins()) {
    const result = await tryClamScan(bin, filePath);
    if (result !== "try_next") return result;
  }
  return {
    status: "skipped",
    message:
      "ClamAV (clamscan) not installed or not on PATH. Install from https://www.clamav.net/ — optional for local POC.",
  };
}
