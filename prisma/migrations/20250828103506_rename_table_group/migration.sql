-- /*
--   Warnings:

--   - You are about to drop the `TableGroup` table. If the table is not empty, all the data it contains will be lost.

-- */
-- -- DropForeignKey
-- ALTER TABLE "TableGroup" DROP CONSTRAINT "TableGroup_outlet_id_fkey";

-- -- DropForeignKey
-- ALTER TABLE "table" DROP CONSTRAINT "table_group_id_fkey";

-- -- DropTable
-- DROP TABLE "TableGroup";

-- -- CreateTable
-- CREATE TABLE "table_group" (
--     "id" SERIAL NOT NULL,
--     "name" VARCHAR NOT NULL,
--     "outlet_id" INTEGER NOT NULL,
--     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

--     CONSTRAINT "table_group_pkey" PRIMARY KEY ("id")
-- );

-- -- CreateIndex
-- CREATE UNIQUE INDEX "table_group_outlet_id_name_key" ON "table_group"("outlet_id", "name");

-- -- AddForeignKey
-- ALTER TABLE "table_group" ADD CONSTRAINT "table_group_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE "table" ADD CONSTRAINT "table_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "table_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- manually done  - just renaming 

-- Simply rename the table from TableGroup to table_group
ALTER TABLE "TableGroup" RENAME TO "table_group";

-- Update the foreign key constraint names to match new naming convention
-- First, drop the old constraints
ALTER TABLE "table_group" DROP CONSTRAINT IF EXISTS "TableGroup_outlet_id_fkey";
ALTER TABLE "table" DROP CONSTRAINT IF EXISTS "table_group_id_fkey";

-- Recreate constraints with proper naming
ALTER TABLE "table_group" ADD CONSTRAINT "table_group_outlet_id_fkey" 
FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "table" ADD CONSTRAINT "table_group_id_fkey" 
FOREIGN KEY ("group_id") REFERENCES "table_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update the unique index name
DROP INDEX IF EXISTS "TableGroup_outlet_id_name_key";
CREATE UNIQUE INDEX "table_group_outlet_id_name_key" ON "table_group"("outlet_id", "name");