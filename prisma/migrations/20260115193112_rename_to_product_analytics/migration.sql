-- CreateTable
CREATE TABLE "product_analytics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new table
INSERT INTO "product_analytics" ("id", "productId", "viewCount", "lastViewedAt", "createdAt")
SELECT "id", "productId", "count", "updatedAt", "createdAt"
FROM "ProductView";

-- DropTable
DROP TABLE "ProductView";

-- CreateIndex
CREATE UNIQUE INDEX "product_analytics_productId_key" ON "product_analytics"("productId");
