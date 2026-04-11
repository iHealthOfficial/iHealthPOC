-- AlterTable
ALTER TABLE "User" ADD COLUMN "consentScopesJson" TEXT;

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "patientId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "metaJson" TEXT,
    CONSTRAINT "ActivityEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ActivityEvent_patientId_idx" ON "ActivityEvent"("patientId");
CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");
