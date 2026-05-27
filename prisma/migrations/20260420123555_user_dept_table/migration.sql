-- CreateTable
CREATE TABLE "user_department_subscription" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "outlet_department_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_department_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_department_subscription_outlet_department_id_idx" ON "user_department_subscription"("outlet_department_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_department_subscription_user_id_outlet_department_id_key" ON "user_department_subscription"("user_id", "outlet_department_id");

-- AddForeignKey
ALTER TABLE "user_department_subscription" ADD CONSTRAINT "user_department_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_department_subscription" ADD CONSTRAINT "user_department_subscription_outlet_department_id_fkey" FOREIGN KEY ("outlet_department_id") REFERENCES "outlet_department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
