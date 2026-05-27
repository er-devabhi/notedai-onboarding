/*
  Warnings:

  - A unique constraint covering the columns `[resourceId]` on the table `table` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "table" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "resourceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "table_resourceId_key" ON "table"("resourceId");
