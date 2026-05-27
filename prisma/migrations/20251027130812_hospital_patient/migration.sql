-- CreateTable
CREATE TABLE "hospital_patient" (
    "id" SERIAL NOT NULL,
    "uhid" TEXT NOT NULL,
    "ip_no" TEXT NOT NULL,
    "doctor_name" TEXT NOT NULL,
    "bed_number" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "patient_number" TEXT NOT NULL,
    "patient_age" INTEGER NOT NULL,
    "patient_gender" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "hospital_patient_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hospital_patient" ADD CONSTRAINT "hospital_patient_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
