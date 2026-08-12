-- AlterEnum
ALTER TYPE "EscalationActionType" ADD VALUE 'Contributed';

-- AlterTable
ALTER TABLE "escalation_level" ADD COLUMN     "field_config" JSONB,
ADD COLUMN     "sla_config" JSONB;

-- AlterTable
ALTER TABLE "hospital_escalation_group" ADD COLUMN     "sla_notified_at" TIMESTAMPTZ(6),
ADD COLUMN     "sla_notified_level_id" INTEGER;
