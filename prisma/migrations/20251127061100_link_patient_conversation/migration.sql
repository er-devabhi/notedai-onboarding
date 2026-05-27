-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "hospital_patient_id" INTEGER;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_hospital_patient_id_fkey" FOREIGN KEY ("hospital_patient_id") REFERENCES "hospital_patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
