-- CreateTable
CREATE TABLE "users" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR,
    "email" VARCHAR,
    "password" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "res_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_files" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "audio_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transcript" JSON,
    "metadata" JSONB,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "audio_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_important" BOOLEAN NOT NULL DEFAULT false,
    "contextual_translate" JSONB,
    "conversation_analysis" JSONB,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "res_name" VARCHAR,
    "num_tables" INTEGER,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrappers_fdw_stats" (
    "fdw_name" TEXT NOT NULL,
    "create_times" BIGINT,
    "rows_in" BIGINT,
    "rows_out" BIGINT,
    "bytes_in" BIGINT,
    "bytes_out" BIGINT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "wrappers_fdw_stats_pkey" PRIMARY KEY ("fdw_name")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_res_id_fkey" FOREIGN KEY ("res_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_audio_id_fkey" FOREIGN KEY ("audio_id") REFERENCES "audio_files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
