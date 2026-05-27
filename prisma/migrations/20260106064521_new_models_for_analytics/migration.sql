-- CreateTable
CREATE TABLE "bbq_branches" (
    "id" SERIAL NOT NULL,
    "branch_name" TEXT,
    "city_name" TEXT,
    "address" TEXT,
    "phone_number" TEXT,
    "branch_alias" TEXT,
    "branch_image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "bbq_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_wise_urls" (
    "id" SERIAL NOT NULL,
    "city_name" TEXT,
    "City-Wise URL's" TEXT,

    CONSTRAINT "city_wise_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_page_sessions" (
    "session_id" VARCHAR(100) NOT NULL,
    "page_name" VARCHAR(255) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "app_name" VARCHAR(255) NOT NULL,
    "opened_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_page_sessions_pkey" PRIMARY KEY ("session_id","page_name")
);

-- CreateTable
CREATE TABLE "dashboard_sessions" (
    "session_id" VARCHAR(100) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "app_name" VARCHAR(255) NOT NULL,
    "opened_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "dashboard_usage_logs" (
    "id" SERIAL NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "app_name" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "event_timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_usage_logs_pkey" PRIMARY KEY ("id")
);
