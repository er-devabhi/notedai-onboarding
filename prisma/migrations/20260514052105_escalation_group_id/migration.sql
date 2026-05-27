/*
  Warnings:

  - The primary key for the `hospital_escalation_group` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `hospital_escalation_group` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `escalation_group_id` column on the `hospital_issue_ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "hospital_issue_ticket" DROP CONSTRAINT "hospital_issue_ticket_escalation_group_id_fkey";

-- AlterTable
ALTER TABLE "hospital_escalation_group" DROP CONSTRAINT "hospital_escalation_group_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "hospital_escalation_group_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "hospital_issue_ticket" DROP COLUMN "escalation_group_id",
ADD COLUMN     "escalation_group_id" INTEGER;

-- CreateIndex
CREATE INDEX "hospital_issue_ticket_escalation_group_id_idx" ON "hospital_issue_ticket"("escalation_group_id");

-- AddForeignKey
ALTER TABLE "hospital_issue_ticket" ADD CONSTRAINT "hospital_issue_ticket_escalation_group_id_fkey" FOREIGN KEY ("escalation_group_id") REFERENCES "hospital_escalation_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
