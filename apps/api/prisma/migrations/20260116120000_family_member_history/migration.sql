-- CreateTable
CREATE TABLE "FamilyMemberHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "patientId" TEXT NOT NULL,
    "identifierSystem" TEXT,
    "identifierValue" TEXT,
    "status" TEXT,
    "dataAbsentReasonText" TEXT,
    "dataAbsentReasonCode" TEXT,
    "date" DATETIME,
    "name" TEXT,
    "relationshipText" TEXT,
    "relationshipCode" TEXT,
    "sex" TEXT,
    "ageString" TEXT,
    "deceasedBoolean" BOOLEAN,
    "deceasedDate" DATETIME,
    "reasonText" TEXT,
    "reasonCode" TEXT,
    CONSTRAINT "FamilyMemberHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FamilyMemberHistory_patientId_idx" ON "FamilyMemberHistory"("patientId");

-- CreateTable
CREATE TABLE "FamilyMemberHistoryCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyMemberHistoryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "outcomeText" TEXT,
    "outcomeCode" TEXT,
    "contributedToDeath" BOOLEAN,
    CONSTRAINT "FamilyMemberHistoryCondition_familyMemberHistoryId_fkey" FOREIGN KEY ("familyMemberHistoryId") REFERENCES "FamilyMemberHistory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FamilyMemberHistoryCondition_familyMemberHistoryId_idx" ON "FamilyMemberHistoryCondition"("familyMemberHistoryId");

-- CreateTable
CREATE TABLE "FamilyMemberHistoryProcedure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyMemberHistoryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "outcomeText" TEXT,
    "outcomeCode" TEXT,
    "contributedToDeath" BOOLEAN,
    CONSTRAINT "FamilyMemberHistoryProcedure_familyMemberHistoryId_fkey" FOREIGN KEY ("familyMemberHistoryId") REFERENCES "FamilyMemberHistory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FamilyMemberHistoryProcedure_familyMemberHistoryId_idx" ON "FamilyMemberHistoryProcedure"("familyMemberHistoryId");
