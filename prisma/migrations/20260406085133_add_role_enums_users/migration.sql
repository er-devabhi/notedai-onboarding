/*
  Warnings:

  - The values [DISHARGE] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MANAGER', 'SALES_MANAGER', 'KITCHEN_MANAGER', 'STAFF', 'DISCHARGE', 'PWO', 'GRE', 'SUPERVISOR', 'SENIOR_EXECUTIVE', 'TRAINEE', 'EXECUTIVE', 'ASSISTANT');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MANAGER';
COMMIT;
