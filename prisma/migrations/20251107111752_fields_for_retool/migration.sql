-- CreateEnum
CREATE TYPE "SalesStatusType" AS ENUM ('Open', 'InProgress', 'Closed');

-- CreateEnum
CREATE TYPE "NegativeStatusType" AS ENUM ('Pending', 'Acknowledged', 'Resolved');

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "corrective_actions" TEXT,
ADD COLUMN     "negative_status" "NegativeStatusType" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "sales_status" "SalesStatusType" NOT NULL DEFAULT 'Open';
