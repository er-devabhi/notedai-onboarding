-- CreateEnum
CREATE TYPE "HospitalPatientCommentStatus" AS ENUM ('Open', 'Assigned', 'NotAssigned', 'Closed');

-- AlterTable
ALTER TABLE "hospital_patient_comment" ADD COLUMN     "status" "HospitalPatientCommentStatus" DEFAULT 'Open';
