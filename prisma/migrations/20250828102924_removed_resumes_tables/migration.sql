/*
  Warnings:

  - You are about to drop the `job_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `match_analyses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parsed_resumes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resumes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "job_submissions" DROP CONSTRAINT "job_submissions_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "match_analyses" DROP CONSTRAINT "match_analyses_jobSubmissionId_fkey";

-- DropForeignKey
ALTER TABLE "parsed_resumes" DROP CONSTRAINT "parsed_resumes_resumeId_fkey";

-- DropTable
DROP TABLE "job_submissions";

-- DropTable
DROP TABLE "match_analyses";

-- DropTable
DROP TABLE "parsed_resumes";

-- DropTable
DROP TABLE "resumes";
