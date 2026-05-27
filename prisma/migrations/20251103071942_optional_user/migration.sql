-- DropForeignKey
ALTER TABLE "conversation" DROP CONSTRAINT "conversation_user_id_fkey";

-- AlterTable
ALTER TABLE "conversation" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
