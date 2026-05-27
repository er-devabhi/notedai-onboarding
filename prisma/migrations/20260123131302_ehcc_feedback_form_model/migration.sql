-- CreateEnum
CREATE TYPE "FeedbackFilledBy" AS ENUM ('PATIENT', 'ATTENDANT');

-- CreateEnum
CREATE TYPE "RatingScale" AS ENUM ('EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR');

-- CreateTable
CREATE TABLE "in_patient_feedback_form" (
    "id" TEXT NOT NULL,
    "patient_name" TEXT,
    "uhid" TEXT,
    "visit_date" TIMESTAMP(3),
    "treating_doctor" TEXT,
    "contact_number" TEXT,
    "email" TEXT,
    "filled_by" "FeedbackFilledBy" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overall_service_quality" "RatingScale",
    "admission_time_efficiency" "RatingScale",
    "financial_counselling" "RatingScale",
    "front_office_behaviour" "RatingScale",
    "doctor_visit_first24_hours" "RatingScale",
    "consent_risk_explanation" "RatingScale",
    "home_medication_info" "RatingScale",
    "hand_hygiene_compliance" "RatingScale",
    "id_band_verification" "RatingScale",
    "call_bell_response" "RatingScale",
    "fall_prevention_education" "RatingScale",
    "pain_management" "RatingScale",
    "dietician_counselling" "RatingScale",
    "food_temperature_and_timing" "RatingScale",
    "room_cleanliness" "RatingScale",
    "staff_hand_hygiene" "RatingScale",
    "response_to_needs" "RatingScale",
    "discharge_medication_info" "RatingScale",
    "discharge_process_time" "RatingScale",
    "relief_from_ailments" "RatingScale",
    "discharge_info_one_day_prior" "RatingScale",
    "privacy_and_safety_compliance" "RatingScale",
    "security_staff_courtesy" "RatingScale",
    "recommendation_score" SMALLINT,
    "comments" TEXT,
    "impressed_staff_name" TEXT,

    CONSTRAINT "in_patient_feedback_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_discharge_feedback_form" (
    "id" TEXT NOT NULL,
    "patient_name" TEXT,
    "uhid" TEXT,
    "visit_date" TIMESTAMP(3),
    "treating_doctor" TEXT,
    "contact_number" TEXT,
    "email" TEXT,
    "filled_by" "FeedbackFilledBy" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overall_hospital_quality" "RatingScale",
    "front_office_politeness" "RatingScale",
    "billing_waiting_time" "RatingScale",
    "front_office_query_response" "RatingScale",
    "consultation_waiting_time" "RatingScale",
    "time_spent_with_doctor" "RatingScale",
    "treatment_information_clarity" "RatingScale",
    "vital_monitoring" "RatingScale",
    "pain_screening_management" "RatingScale",
    "fall_education_information" "RatingScale",
    "sample_collection_skills" "RatingScale",
    "report_timeliness" "RatingScale",
    "radiology_consent_process" "RatingScale",
    "medicine_availability" "RatingScale",
    "medicine_education" "RatingScale",
    "pharmacy_waiting_time" "RatingScale",
    "food_quality" "RatingScale",
    "cleanliness_and_hygiene" "RatingScale",
    "parking_facilities" "RatingScale",
    "security_staff_courtesy" "RatingScale",
    "recommendation_score" SMALLINT,
    "comments" TEXT,
    "impressed_staff_name" TEXT,

    CONSTRAINT "post_discharge_feedback_form_pkey" PRIMARY KEY ("id")
);
