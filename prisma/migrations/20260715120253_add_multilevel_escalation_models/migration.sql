-- CreateEnum
CREATE TYPE "EscalationActionType" AS ENUM ('Saved', 'Resolved', 'Escalated');

-- AlterTable
ALTER TABLE "hospital_escalation_group" ADD COLUMN     "current_level_id" INTEGER;

-- CreateTable
CREATE TABLE "escalation_level" (
    "id" SERIAL NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "escalation_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_action" (
    "id" SERIAL NOT NULL,
    "escalation_group_id" INTEGER NOT NULL,
    "level_id" INTEGER,
    "level_key" TEXT,
    "role" "UserRole",
    "performed_by" UUID,
    "performed_by_name" TEXT,
    "rca" TEXT,
    "capa" TEXT,
    "corrective_action" TEXT,
    "service_recovery" TEXT,
    "action" "EscalationActionType" NOT NULL,
    "escalated_to_level_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalation_action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "escalation_level_outlet_id_sequence_idx" ON "escalation_level"("outlet_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "escalation_level_outlet_id_key_key" ON "escalation_level"("outlet_id", "key");

-- CreateIndex
CREATE INDEX "escalation_action_escalation_group_id_created_at_idx" ON "escalation_action"("escalation_group_id", "created_at");

-- CreateIndex
CREATE INDEX "hospital_escalation_group_current_level_id_idx" ON "hospital_escalation_group"("current_level_id");

-- AddForeignKey
ALTER TABLE "hospital_escalation_group" ADD CONSTRAINT "hospital_escalation_group_current_level_id_fkey" FOREIGN KEY ("current_level_id") REFERENCES "escalation_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_level" ADD CONSTRAINT "escalation_level_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_action" ADD CONSTRAINT "escalation_action_escalation_group_id_fkey" FOREIGN KEY ("escalation_group_id") REFERENCES "hospital_escalation_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_action" ADD CONSTRAINT "escalation_action_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "escalation_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
