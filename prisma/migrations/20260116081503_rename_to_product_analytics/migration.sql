/*
  Warnings:

  - You are about to drop the `ProductView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductView";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "product_analytics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "product_analytics_productId_key" ON "product_analytics"("productId");
