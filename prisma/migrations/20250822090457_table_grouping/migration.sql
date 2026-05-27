-- AlterTable
ALTER TABLE "table" ADD COLUMN     "group_id" INTEGER;

-- CreateTable
CREATE TABLE "TableGroup" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "TableGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableGroup_outlet_id_name_key" ON "TableGroup"("outlet_id", "name");

-- AddForeignKey
ALTER TABLE "TableGroup" ADD CONSTRAINT "TableGroup_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "TableGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
