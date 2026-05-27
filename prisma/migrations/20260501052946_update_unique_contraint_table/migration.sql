/*
  Warnings:

  - A unique constraint covering the columns `[table_no,outlet_id,group_id]` on the table `table` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "table_table_no_outlet_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "table_table_no_outlet_id_group_id_key" ON "table"("table_no", "outlet_id", "group_id");
