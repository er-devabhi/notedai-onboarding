-- AlterTable
ALTER TABLE "audio_files" ADD COLUMN     "is_success" BOOLEAN DEFAULT false,
ADD COLUMN     "uploaded_by" UUID;

-- AddForeignKey
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
