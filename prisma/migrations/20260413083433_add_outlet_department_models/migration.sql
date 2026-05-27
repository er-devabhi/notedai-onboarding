-- CreateEnum
CREATE TYPE "contact_type" AS ENUM ('TO', 'CC');

-- AlterTable
ALTER TABLE "outlet" ADD COLUMN     "dashboard_url" VARCHAR,
ADD COLUMN     "default_email_cc" VARCHAR[];

-- CreateTable
CREATE TABLE "outlet_department" (
    "id" SERIAL NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlet_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_config" (
    "id" SERIAL NOT NULL,
    "outlet_department_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp_number" VARCHAR[],
    "type" "contact_type" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outlet_department_outlet_id_name_key" ON "outlet_department"("outlet_id", "name");

-- CreateIndex
CREATE INDEX "department_config_outlet_department_id_idx" ON "department_config"("outlet_department_id");

-- AddForeignKey
ALTER TABLE "outlet_department" ADD CONSTRAINT "outlet_department_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_config" ADD CONSTRAINT "department_config_outlet_department_id_fkey" FOREIGN KEY ("outlet_department_id") REFERENCES "outlet_department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
