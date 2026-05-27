-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "ambience_attributes" JSONB,
ADD COLUMN     "guest_profile_attributes" JSONB,
ADD COLUMN     "manager_actions_attributes" JSONB,
ADD COLUMN     "service_attributes" JSONB;
