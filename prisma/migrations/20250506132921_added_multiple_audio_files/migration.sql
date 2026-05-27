/*
  Warnings:

  - You are about to drop the column `audio_id` on the `conversation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "conversation" DROP CONSTRAINT "conversation_audio_id_fkey";

-- AlterTable
ALTER TABLE "audio_files" ADD COLUMN     "conversation_id" UUID;

-- AlterTable
ALTER TABLE "conversation" DROP COLUMN "audio_id",
ADD COLUMN     "is_success" BOOLEAN DEFAULT false;

-- AddForeignKey
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
