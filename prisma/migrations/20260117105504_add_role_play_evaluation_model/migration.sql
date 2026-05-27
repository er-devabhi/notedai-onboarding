-- CreateTable
CREATE TABLE "role_play_evaluation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "redFlags" JSONB NOT NULL,
    "sopAdherenceTag" TEXT NOT NULL,
    "sopAdherenceNote" TEXT NOT NULL,
    "sopSteps" JSONB NOT NULL,
    "communicationClarityTag" TEXT NOT NULL,
    "communicationClarityNote" TEXT NOT NULL,
    "confidenceTag" TEXT NOT NULL,
    "confidenceNote" TEXT NOT NULL,
    "empathyTag" TEXT NOT NULL,
    "empathyNote" TEXT NOT NULL,
    "activeListeningTag" TEXT NOT NULL,
    "activeListeningNote" TEXT NOT NULL,
    "pressureObjectionLevel" TEXT NOT NULL,
    "pressureObjectionTag" TEXT NOT NULL,
    "pressureObjectionNote" TEXT NOT NULL,
    "pressureObjectionEvidence" TEXT,
    "learningBehaviorTag" TEXT NOT NULL,
    "learningBehaviorNote" TEXT NOT NULL,
    "alternatesSolutions" JSONB NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],

    CONSTRAINT "role_play_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_play_evaluation_created_at_idx" ON "role_play_evaluation"("created_at");
