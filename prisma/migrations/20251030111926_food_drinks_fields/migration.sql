-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "drink_issue" TEXT,
ADD COLUMN     "drink_mentioned" VARCHAR[],
ADD COLUMN     "food_issue" TEXT,
ADD COLUMN     "food_mentioned" VARCHAR[];
