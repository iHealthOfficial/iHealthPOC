-- CreateTable
CREATE TABLE "FeedbackReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME,
    CONSTRAINT "FeedbackReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FeedbackReport_userId_idx" ON "FeedbackReport"("userId");
CREATE INDEX "FeedbackReport_createdAt_idx" ON "FeedbackReport"("createdAt");
