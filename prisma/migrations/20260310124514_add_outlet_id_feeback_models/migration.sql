-- AlterTable
ALTER TABLE "in_patient_feedback_form" ADD COLUMN     "outlet_id" INTEGER;

-- AlterTable
ALTER TABLE "post_discharge_feedback_form" ADD COLUMN     "outlet_id" INTEGER;

-- AddForeignKey
ALTER TABLE "in_patient_feedback_form" ADD CONSTRAINT "in_patient_feedback_form_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_discharge_feedback_form" ADD CONSTRAINT "post_discharge_feedback_form_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
