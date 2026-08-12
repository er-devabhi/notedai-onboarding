-- AlterEnum
ALTER TYPE "HospitalIssueTicketStatus" ADD VALUE 'Resolved';

-- AlterTable
ALTER TABLE "hospital_escalation_group" ADD COLUMN     "service_recovery" TEXT;
