-- AlterTable
ALTER TABLE "patient_autocomplete" ADD COLUMN     "outlet_id" INTEGER;

-- AddForeignKey
ALTER TABLE "patient_autocomplete" ADD CONSTRAINT "patient_autocomplete_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
