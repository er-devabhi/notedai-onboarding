-- AlterTable
ALTER TABLE "hospital_issue_ticket" ADD COLUMN     "corrective_actions" TEXT,
ADD COLUMN     "negative_status" "NegativeStatusType" NOT NULL DEFAULT 'Pending';
