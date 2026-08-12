-- AlterTable
ALTER TABLE "in_patient_feedback_form" ADD COLUMN     "bed_number" TEXT,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "ip_no" TEXT;

-- AlterTable
ALTER TABLE "post_discharge_feedback_form" ADD COLUMN     "bed_number" TEXT,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "ip_no" TEXT;
