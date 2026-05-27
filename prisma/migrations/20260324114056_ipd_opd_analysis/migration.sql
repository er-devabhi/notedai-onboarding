-- AlterTable
ALTER TABLE "in_patient_feedback_form" ADD COLUMN     "analysis" JSONB,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "post_discharge_feedback_form" ADD COLUMN     "analysis" JSONB,
ADD COLUMN     "summary" TEXT;
