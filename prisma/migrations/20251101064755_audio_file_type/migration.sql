-- CreateEnum
CREATE TYPE "AudioFileType" AS ENUM ('Feedback', 'QrCodeFeedback');

-- AlterTable
ALTER TABLE "audio_files" ADD COLUMN     "type" "AudioFileType" NOT NULL DEFAULT 'Feedback';
