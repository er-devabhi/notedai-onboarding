-- CreateEnum
CREATE TYPE "HospitalIssueTicketSeverity" AS ENUM ('Low', 'High', 'Medium');

-- CreateEnum
CREATE TYPE "HospitalIssueTicketStatus" AS ENUM ('Pending', 'Escalated', 'NotEscalated', 'Current', 'Closed');

-- AlterTable
ALTER TABLE "table_group" RENAME CONSTRAINT "TableGroup_pkey" TO "table_group_pkey";

-- CreateTable
CREATE TABLE "hospital_issue_ticket" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT,
    "severity" "HospitalIssueTicketSeverity" NOT NULL,
    "pwo" TEXT,
    "is_email_sent" BOOLEAN DEFAULT false,
    "status" "HospitalIssueTicketStatus" DEFAULT 'Pending',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "conversation_id" UUID NOT NULL,
    "outlet_id" INTEGER NOT NULL,

    CONSTRAINT "hospital_issue_ticket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hospital_issue_ticket" ADD CONSTRAINT "hospital_issue_ticket_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_issue_ticket" ADD CONSTRAINT "hospital_issue_ticket_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
