-- AlterTable
ALTER TABLE "escalation_action" ADD COLUMN     "ticket_id" INTEGER,
ALTER COLUMN "escalation_group_id" DROP NOT NULL;
