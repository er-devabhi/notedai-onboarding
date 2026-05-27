-- AlterTable
ALTER TABLE "hospital_patient_comment" ADD COLUMN     "outlet_id" INTEGER;

-- AddForeignKey
ALTER TABLE "hospital_patient_comment" ADD CONSTRAINT "hospital_patient_comment_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
