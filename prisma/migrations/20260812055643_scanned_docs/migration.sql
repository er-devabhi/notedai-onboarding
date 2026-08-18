-- CreateEnum
CREATE TYPE "ScannedDocStatus" AS ENUM ('Pending', 'Processing', 'Completed', 'Failed');

-- CreateTable
CREATE TABLE "scanned_doc" (
    "id" SERIAL NOT NULL,
    "outletId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "status" "ScannedDocStatus" NOT NULL DEFAULT 'Pending',
    "pageCount" INTEGER NOT NULL,
    "ocrResult" JSONB,
    "isSuccess" BOOLEAN DEFAULT false,
    "retryCount" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scanned_doc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scanned_doc_page" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scannedDocId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "ocrText" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanned_doc_page_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scanned_doc" ADD CONSTRAINT "scanned_doc_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scanned_doc" ADD CONSTRAINT "scanned_doc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scanned_doc_page" ADD CONSTRAINT "scanned_doc_page_scannedDocId_fkey" FOREIGN KEY ("scannedDocId") REFERENCES "scanned_doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
