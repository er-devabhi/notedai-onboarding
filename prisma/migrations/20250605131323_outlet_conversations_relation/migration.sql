-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "outlet_id" INTEGER;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
