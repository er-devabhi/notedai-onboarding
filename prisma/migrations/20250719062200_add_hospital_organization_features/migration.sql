-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('RESTAURANT', 'HOSPITAL');

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN "is_offline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "offline_created_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "outlet" ADD COLUMN "managerNames" VARCHAR[];

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "managerNames" VARCHAR[],
ADD COLUMN "organizationType" "OrganizationType" NOT NULL DEFAULT 'RESTAURANT';
