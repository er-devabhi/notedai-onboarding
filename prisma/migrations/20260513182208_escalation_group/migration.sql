-- AlterTable
ALTER TABLE "hospital_issue_ticket" ADD COLUMN     "escalation_group_id" TEXT;

-- CreateTable
CREATE TABLE "hospital_escalation_group" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" "EscalationStatus" NOT NULL DEFAULT 'Pending',
    "rca" TEXT,
    "capa" TEXT,
    "created_by" TEXT,
    "department" TEXT,
    "outlet_id" INTEGER NOT NULL,
    "acknowledged_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "escalated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hospital_escalation_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hospital_escalation_group_outlet_id_idx" ON "hospital_escalation_group"("outlet_id");

-- CreateIndex
CREATE INDEX "hospital_escalation_group_department_idx" ON "hospital_escalation_group"("department");

-- CreateIndex
CREATE INDEX "hospital_issue_ticket_escalation_group_id_idx" ON "hospital_issue_ticket"("escalation_group_id");

-- AddForeignKey
ALTER TABLE "hospital_issue_ticket" ADD CONSTRAINT "hospital_issue_ticket_escalation_group_id_fkey" FOREIGN KEY ("escalation_group_id") REFERENCES "hospital_escalation_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_escalation_group" ADD CONSTRAINT "hospital_escalation_group_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
