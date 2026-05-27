-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('Teaching', 'Testing', 'Roleplay');

-- CreateTable
CREATE TABLE "scenario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_prompts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "PromptType" NOT NULL,
    "voice_prompt" TEXT,
    "evaluatlion_prompt" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "scenarioId" UUID,

    CONSTRAINT "scenario_prompts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scenario_prompts" ADD CONSTRAINT "scenario_prompts_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
