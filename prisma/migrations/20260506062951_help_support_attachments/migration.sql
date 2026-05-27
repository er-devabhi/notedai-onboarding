-- AlterTable
ALTER TABLE "support_ticket" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
