-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('Feedback', 'QrCodeFeedback');

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "type" "ConversationType" NOT NULL DEFAULT 'Feedback';
