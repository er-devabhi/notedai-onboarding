-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('Pending', 'Acknowledged', 'Resolved');

-- AlterTable
ALTER TABLE "hospital_issue_ticket" ADD COLUMN     "escalation_status" "EscalationStatus" NOT NULL DEFAULT 'Pending';
