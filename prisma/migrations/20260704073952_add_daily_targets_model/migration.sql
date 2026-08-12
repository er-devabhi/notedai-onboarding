-- CreateTable
CREATE TABLE "daily_targets" (
    "id" SERIAL NOT NULL,
    "user_id" UUID,
    "department_name" TEXT,
    "target_date" DATE NOT NULL,
    "target_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_targets_user_id_target_date_key" ON "daily_targets"("user_id", "target_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_targets_department_name_target_date_key" ON "daily_targets"("department_name", "target_date");

-- AddForeignKey
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
