/*
  Warnings:

  - The values [Pending] on the enum `HospitalIssueTicketStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "HospitalIssueTicketStatus_new" AS ENUM ('Open', 'Overdue', 'Escalated', 'NotEscalated', 'Current', 'Closed');
ALTER TABLE "hospital_issue_ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "hospital_issue_ticket" ALTER COLUMN "status" TYPE "HospitalIssueTicketStatus_new" USING ("status"::text::"HospitalIssueTicketStatus_new");
ALTER TYPE "HospitalIssueTicketStatus" RENAME TO "HospitalIssueTicketStatus_old";
ALTER TYPE "HospitalIssueTicketStatus_new" RENAME TO "HospitalIssueTicketStatus";
DROP TYPE "HospitalIssueTicketStatus_old";
ALTER TABLE "hospital_issue_ticket" ALTER COLUMN "status" SET DEFAULT 'Open';
COMMIT;

-- AlterTable
ALTER TABLE "hospital_issue_ticket" ALTER COLUMN "status" SET DEFAULT 'Open';
