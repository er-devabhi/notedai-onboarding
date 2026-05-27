/*
  Warnings:

  - You are about to drop the column `managerNames` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `promptId` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SALES_MANAGER', 'KITCHEN_MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "MealTime" AS ENUM ('Breakfast', 'Lunch', 'Snacks', 'Dinner', 'LateNight');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Pending', 'Resolved');

-- DropForeignKey
ALTER TABLE "restaurants" DROP CONSTRAINT "restaurants_promptId_fkey";

-- DropIndex
DROP INDEX "restaurants_promptId_key";

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "ambiencePlaceIssue" TEXT,
ADD COLUMN     "customerSentimentScore" INTEGER,
ADD COLUMN     "exceptionalHighlights" TEXT,
ADD COLUMN     "foodDrinksIssue" TEXT,
ADD COLUMN     "guestProfiling" TEXT,
ADD COLUMN     "managerActions" TEXT,
ADD COLUMN     "managerEvaluation" TEXT,
ADD COLUMN     "managerName" TEXT,
ADD COLUMN     "managerScore" INTEGER,
ADD COLUMN     "meal" "MealTime",
ADD COLUMN     "negativeFeedback" TEXT,
ADD COLUMN     "npsScore" INTEGER,
ADD COLUMN     "sales" TEXT,
ADD COLUMN     "serverName" TEXT,
ADD COLUMN     "serviceIssue" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "outlet" ADD COLUMN     "region" VARCHAR,
ADD COLUMN     "serverNames" VARCHAR[];

-- AlterTable
ALTER TABLE "restaurants" DROP COLUMN "managerNames",
DROP COLUMN "promptId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MANAGER';

-- DropTable
DROP TABLE "Prompt";

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "outletId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
