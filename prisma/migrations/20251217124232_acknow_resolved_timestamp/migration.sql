-- AlterTable
ALTER TABLE "hospital_issue_ticket" ADD COLUMN     "acknowledged_at" TIMESTAMPTZ(6),
ADD COLUMN     "resolved_at" TIMESTAMPTZ(6);
