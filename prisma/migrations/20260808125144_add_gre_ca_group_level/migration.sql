-- AlterEnum
ALTER TYPE "EscalationActionType" ADD VALUE 'Closed';

-- AlterEnum
ALTER TYPE "EscalationStatus" ADD VALUE 'Closed';

-- AlterTable
ALTER TABLE "hospital_escalation_group" ADD COLUMN     "gre_corrective_action" TEXT;
