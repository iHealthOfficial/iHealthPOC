-- AlterTable
ALTER TABLE "UploadArtifact" ADD COLUMN "scanStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "UploadArtifact" ADD COLUMN "scanMessage" TEXT;
ALTER TABLE "UploadArtifact" ADD COLUMN "ocrStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "UploadArtifact" ADD COLUMN "ocrMessage" TEXT;
ALTER TABLE "UploadArtifact" ADD COLUMN "ocrText" TEXT;
