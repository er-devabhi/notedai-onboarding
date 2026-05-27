-- CreateTable
CREATE TABLE "hospital_patient_request" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "conversation_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "hospital_patient_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_exceptional_highlight" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "compliment" TEXT NOT NULL,
    "conversation_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "hospital_exceptional_highlight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hospital_patient_request" ADD CONSTRAINT "hospital_patient_request_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_exceptional_highlight" ADD CONSTRAINT "hospital_exceptional_highlight_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
