/*
  Warnings:

  - A unique constraint covering the columns `[promptId]` on the table `restaurants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "promptId" INTEGER;

-- CreateTable
CREATE TABLE "Prompt" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translatorPrompt" TEXT,
    "analysisPrompt" TEXT,
    "menuItems" JSONB,
    "keywords" JSONB,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_promptId_key" ON "restaurants"("promptId");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
