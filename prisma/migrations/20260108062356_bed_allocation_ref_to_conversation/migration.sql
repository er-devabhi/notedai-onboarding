-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "bed_allocation_id" INTEGER;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_bed_allocation_id_fkey" FOREIGN KEY ("bed_allocation_id") REFERENCES "bed_allocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
