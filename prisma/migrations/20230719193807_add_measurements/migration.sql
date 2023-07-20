-- CreateTable
CREATE TABLE "Measurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sys" INTEGER NOT NULL,
    "dia" INTEGER NOT NULL,
    "pulse" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Measurements_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Measurements_id_key" ON "Measurements"("id");
