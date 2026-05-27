-- CreateIndex
CREATE INDEX "hospital_patient_bed_number_outlet_id_admission_date_idx" ON "hospital_patient"("bed_number", "outlet_id", "admission_date");
