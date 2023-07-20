-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Measurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sys" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "pulse" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Measurements_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Measurements" ("createdAt", "description", "dia", "id", "ownerId", "pulse", "sys", "updatedAt") SELECT "createdAt", "description", "dia", "id", "ownerId", "pulse", "sys", "updatedAt" FROM "Measurements";
DROP TABLE "Measurements";
ALTER TABLE "new_Measurements" RENAME TO "Measurements";
CREATE UNIQUE INDEX "Measurements_id_key" ON "Measurements"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
