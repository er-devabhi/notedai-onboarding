-- CreateEnum
CREATE TYPE "QrLoginStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "qr_login" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outlet_id" INTEGER NOT NULL,
    "label" VARCHAR NOT NULL,
    "token_hash" VARCHAR NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "QrLoginStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "qr_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_login_token_hash_key" ON "qr_login"("token_hash");

-- CreateIndex
CREATE INDEX "qr_login_outlet_id_idx" ON "qr_login"("outlet_id");

-- CreateIndex
CREATE INDEX "qr_login_user_id_idx" ON "qr_login"("user_id");

-- AddForeignKey
ALTER TABLE "qr_login" ADD CONSTRAINT "qr_login_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_login" ADD CONSTRAINT "qr_login_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
