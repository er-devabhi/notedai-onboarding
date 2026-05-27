-- CreateTable
CREATE TABLE "patient" (
    "id" SERIAL NOT NULL,
    "uhid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "attendant_phone_number" TEXT,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "company" TEXT,
    "outlet_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission" (
    "id" SERIAL NOT NULL,
    "ip_no" TEXT NOT NULL,
    "doctor_name" TEXT,
    "admission_date" TIMESTAMPTZ(6) NOT NULL,
    "discharge_date" TIMESTAMPTZ(6),
    "patient_id" INTEGER NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bed_allocation" (
    "id" SERIAL NOT NULL,
    "bed_number" TEXT NOT NULL,
    "sanitized_bed_number" TEXT,
    "from_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6),
    "admission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bed_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_uhid_key" ON "patient"("uhid");

-- CreateIndex
CREATE UNIQUE INDEX "admission_ip_no_outlet_id_key" ON "admission"("ip_no", "outlet_id");

-- CreateIndex
CREATE INDEX "bed_allocation_admission_id_from_time_idx" ON "bed_allocation"("admission_id", "from_time");

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission" ADD CONSTRAINT "admission_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission" ADD CONSTRAINT "admission_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bed_allocation" ADD CONSTRAINT "bed_allocation_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
