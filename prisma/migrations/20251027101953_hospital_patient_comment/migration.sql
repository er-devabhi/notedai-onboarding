-- CreateEnum
CREATE TYPE "HospitalPatientComment" AS ENUM ('Highlight', 'Request');

-- CreateTable
CREATE TABLE "hospital_patient_comment" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "type" "HospitalPatientComment" NOT NULL,
    "conversation_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "hospital_patient_comment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hospital_patient_comment" ADD CONSTRAINT "hospital_patient_comment_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
