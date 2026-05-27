-- AlterTable
ALTER TABLE "outlet" ADD COLUMN     "branchCode" TEXT;

-- CreateTable
CREATE TABLE "job_submissions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "jobTitle" TEXT,
    "company" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,

    CONSTRAINT "job_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_analyses" (
    "id" TEXT NOT NULL,
    "jobSubmissionId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "overallFit" TEXT NOT NULL,
    "summary" TEXT,
    "strengths" JSONB,
    "skillsMatch" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parsed_resumes" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "summary" TEXT,
    "experience" JSONB,
    "education" JSONB,
    "skills" JSONB,
    "projects" JSONB,
    "certifications" JSONB,
    "languages" JSONB,
    "rawText" TEXT,
    "parsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parsingStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,

    CONSTRAINT "parsed_resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_analyses_jobSubmissionId_key" ON "match_analyses"("jobSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "parsed_resumes_resumeId_key" ON "parsed_resumes"("resumeId");

-- AddForeignKey
ALTER TABLE "job_submissions" ADD CONSTRAINT "job_submissions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_analyses" ADD CONSTRAINT "match_analyses_jobSubmissionId_fkey" FOREIGN KEY ("jobSubmissionId") REFERENCES "job_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parsed_resumes" ADD CONSTRAINT "parsed_resumes_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
