-- AlterTable
ALTER TABLE "hospital_issue_ticket" ADD COLUMN     "in_patient_feedback_id" TEXT,
ADD COLUMN     "post_discharge_feedback_id" TEXT,
ALTER COLUMN "conversation_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "hospital_issue_ticket" ADD CONSTRAINT "hospital_issue_ticket_in_patient_feedback_id_fkey" FOREIGN KEY ("in_patient_feedback_id") REFERENCES "in_patient_feedback_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_issue_ticket" ADD CONSTRAINT "hospital_issue_ticket_post_discharge_feedback_id_fkey" FOREIGN KEY ("post_discharge_feedback_id") REFERENCES "post_discharge_feedback_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
