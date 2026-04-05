-- AlterTable
ALTER TABLE "Practitioner" ADD COLUMN "contextEncounterId" TEXT;

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "Condition" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "DiagnosticReport" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "Procedure" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "AllergyIntolerance" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "MedicationRequest" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "MedicationAdministration" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "MedicationDispense" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "MedicationStatement" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN "encounterId" TEXT;

-- AlterTable
ALTER TABLE "Immunization" ADD COLUMN "encounterId" TEXT;
