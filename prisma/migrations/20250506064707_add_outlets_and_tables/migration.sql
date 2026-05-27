/*
  Warnings:

  - You are about to drop the column `num_tables` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `res_name` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `res_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_res_id_fkey";

-- AlterTable
ALTER TABLE "restaurants" DROP COLUMN "num_tables",
DROP COLUMN "res_name",
ADD COLUMN     "restaurant_name" VARCHAR;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "res_id",
ADD COLUMN     "restaurant_id" INTEGER;

-- CreateTable
CREATE TABLE "outlet" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR NOT NULL,
    "location" VARCHAR,
    "restaurant_id" INTEGER NOT NULL,

    CONSTRAINT "outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table" (
    "id" SERIAL NOT NULL,
    "table_no" VARCHAR NOT NULL,
    "outlet_id" INTEGER NOT NULL,

    CONSTRAINT "table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "table_table_no_outlet_id_key" ON "table"("table_no", "outlet_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
