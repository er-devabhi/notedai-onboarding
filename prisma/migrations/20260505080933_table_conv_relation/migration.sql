-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "table_id" INTEGER;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
