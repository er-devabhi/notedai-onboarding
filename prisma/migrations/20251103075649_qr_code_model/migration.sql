-- CreateTable
CREATE TABLE "qr_code_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "table_id" INTEGER NOT NULL,

    CONSTRAINT "qr_code_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_code_feedback_table_id_key" ON "qr_code_feedback"("table_id");

-- AddForeignKey
ALTER TABLE "qr_code_feedback" ADD CONSTRAINT "qr_code_feedback_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
