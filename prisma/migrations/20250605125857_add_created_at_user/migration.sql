-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now());
