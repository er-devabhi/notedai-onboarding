-- DropForeignKey
ALTER TABLE "admission" DROP CONSTRAINT "admission_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "bed_allocation" DROP CONSTRAINT "bed_allocation_admission_id_fkey";

-- AddForeignKey
ALTER TABLE "admission" ADD CONSTRAINT "admission_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bed_allocation" ADD CONSTRAINT "bed_allocation_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
