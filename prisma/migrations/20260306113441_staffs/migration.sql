-- CreateTable
CREATE TABLE "staffs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "table_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
