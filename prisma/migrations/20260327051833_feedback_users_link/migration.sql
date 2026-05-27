-- AlterTable
ALTER TABLE "in_patient_feedback_form" ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "post_discharge_feedback_form" ADD COLUMN     "user_id" UUID;

-- AddForeignKey
ALTER TABLE "in_patient_feedback_form" ADD CONSTRAINT "in_patient_feedback_form_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_discharge_feedback_form" ADD CONSTRAINT "post_discharge_feedback_form_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
