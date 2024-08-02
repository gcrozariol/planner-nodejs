/*
  Warnings:

  - Added the required column `title` to the `links` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `links` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "links_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_links" ("id", "tripId") SELECT "id", "tripId" FROM "links";
DROP TABLE "links";
ALTER TABLE "new_links" RENAME TO "links";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
