-- AlterTable
ALTER TABLE "transcription_analysis" ADD COLUMN     "scenario_prompt_id" UUID;

-- AddForeignKey
ALTER TABLE "transcription_analysis" ADD CONSTRAINT "transcription_analysis_scenario_prompt_id_fkey" FOREIGN KEY ("scenario_prompt_id") REFERENCES "scenario_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
