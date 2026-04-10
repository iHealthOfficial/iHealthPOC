-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "patientId" TEXT NOT NULL,
    "identifierSystem" TEXT,
    "identifierValue" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "typeText" TEXT,
    "typeCode" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "contactAddressLine" TEXT,
    CONSTRAINT "Organization_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Organization_patientId_idx" ON "Organization"("patientId");

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN "serviceProviderOrganizationId" TEXT;

-- CreateIndex
CREATE INDEX "Encounter_serviceProviderOrganizationId_idx" ON "Encounter"("serviceProviderOrganizationId");
