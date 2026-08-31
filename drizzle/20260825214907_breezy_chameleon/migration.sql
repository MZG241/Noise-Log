ALTER TABLE "exposure_logs" ADD COLUMN "leq_db" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "exposure_logs" ADD COLUMN "peak_db" double precision;--> statement-breakpoint
ALTER TABLE "exposure_logs" ADD COLUMN "test" text;