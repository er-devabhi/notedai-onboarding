-- CreateEnum
CREATE TYPE "EscalationLevel" AS ENUM ('ServiceExcellence', 'Department');

-- AlterTable
ALTER TABLE "hospital_escalation_group" ADD COLUMN     "level" "EscalationLevel" NOT NULL DEFAULT 'Department';

-- CreateIndex
CREATE INDEX "hospital_escalation_group_level_idx" ON "hospital_escalation_group"("level");
