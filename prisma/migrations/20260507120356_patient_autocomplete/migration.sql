-- CreateTable
CREATE TABLE "patient_autocomplete" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "uhid" TEXT,
    "phone_number" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "patient_autocomplete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_autocomplete_name_idx" ON "patient_autocomplete"("name");

-- CreateIndex
CREATE INDEX "patient_autocomplete_phone_number_idx" ON "patient_autocomplete"("phone_number");

-- CreateIndex
CREATE INDEX "patient_autocomplete_uhid_idx" ON "patient_autocomplete"("uhid");
