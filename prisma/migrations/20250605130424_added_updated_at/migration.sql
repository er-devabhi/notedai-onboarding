-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now());

-- AlterTable
ALTER TABLE "audio_files" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now());

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now());

-- AlterTable
ALTER TABLE "outlet" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now());

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now());
