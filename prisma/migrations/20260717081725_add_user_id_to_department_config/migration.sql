/*
  Warnings:

  - The values [Saved] on the enum `EscalationActionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EscalationActionType_new" AS ENUM ('Resolved', 'Escalated');
ALTER TABLE "escalation_action" ALTER COLUMN "action" TYPE "EscalationActionType_new" USING ("action"::text::"EscalationActionType_new");
ALTER TYPE "EscalationActionType" RENAME TO "EscalationActionType_old";
ALTER TYPE "EscalationActionType_new" RENAME TO "EscalationActionType";
DROP TYPE "EscalationActionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "department_config" ADD COLUMN     "user_id" UUID;

-- CreateIndex
CREATE INDEX "department_config_user_id_idx" ON "department_config"("user_id");

-- CreateIndex
CREATE INDEX "escalation_action_performed_by_action_idx" ON "escalation_action"("performed_by", "action");

-- AddForeignKey
ALTER TABLE "department_config" ADD CONSTRAINT "department_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
