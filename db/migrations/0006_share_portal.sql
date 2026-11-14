-- =============================================================================
-- 0006: Public share portal and persistent customer submissions
--
-- A share link is an owner-created, revocable, optionally expiring token. A
-- submission is a real row: customer details, one row per service, one row per
-- chosen catalogue item, with the indicative amount computed on the server.
--
-- Every table carries org_id. Idempotent: safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "share_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "event_id" uuid,
  "token" text NOT NULL,
  -- 'event' scopes the portal to one event; 'catalogue' shows the whole catalogue.
  "kind" text DEFAULT 'event' NOT NULL,
  "expires_at" timestamp with time zone,
  "revoked" boolean DEFAULT false NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "share_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "share_link_id" uuid,
  "event_id" uuid,
  "enquiry_id" uuid,
  "client_name" text NOT NULL,
  "client_email" text,
  "client_phone" text,
  "message" text,
  -- 'new' | 'reviewed' | 'quoted' | 'closed'
  "status" text DEFAULT 'new' NOT NULL,
  "indicative_total_paise" integer DEFAULT 0 NOT NULL,
  -- Repeat-submission guard for the same link, contact and selection.
  "dedupe_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "share_submission_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "submission_id" uuid NOT NULL,
  "service_key" text NOT NULL,
  "status" text DEFAULT 'requested' NOT NULL,
  "indicative_paise" integer DEFAULT 0 NOT NULL,
  "config" jsonb DEFAULT '{}' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "share_submission_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "submission_service_id" uuid NOT NULL,
  "item_id" uuid,
  "category_id" uuid,
  "label" text NOT NULL,
  -- Copied at submission time; the catalogue may change afterwards.
  "unit_class" text DEFAULT 'FLAT' NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "basis" integer DEFAULT 1 NOT NULL,
  "unit_price_paise" integer DEFAULT 0 NOT NULL,
  "indicative_paise" integer DEFAULT 0 NOT NULL,
  "note" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign keys ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_links_org_id_organisations_id_fk') THEN
    ALTER TABLE "share_links" ADD CONSTRAINT "share_links_org_id_organisations_id_fk"
      FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_links_event_id_events_id_fk') THEN
    ALTER TABLE "share_links" ADD CONSTRAINT "share_links_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submissions_org_id_organisations_id_fk') THEN
    ALTER TABLE "share_submissions" ADD CONSTRAINT "share_submissions_org_id_organisations_id_fk"
      FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submissions_share_link_id_share_links_id_fk') THEN
    ALTER TABLE "share_submissions" ADD CONSTRAINT "share_submissions_share_link_id_share_links_id_fk"
      FOREIGN KEY ("share_link_id") REFERENCES "public"."share_links"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submissions_event_id_events_id_fk') THEN
    ALTER TABLE "share_submissions" ADD CONSTRAINT "share_submissions_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submissions_enquiry_id_enquiries_id_fk') THEN
    ALTER TABLE "share_submissions" ADD CONSTRAINT "share_submissions_enquiry_id_enquiries_id_fk"
      FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submission_services_submission_id_fk') THEN
    ALTER TABLE "share_submission_services" ADD CONSTRAINT "share_submission_services_submission_id_fk"
      FOREIGN KEY ("submission_id") REFERENCES "public"."share_submissions"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submission_lines_service_id_fk') THEN
    ALTER TABLE "share_submission_lines" ADD CONSTRAINT "share_submission_lines_service_id_fk"
      FOREIGN KEY ("submission_service_id") REFERENCES "public"."share_submission_services"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submission_lines_item_id_service_items_id_fk') THEN
    ALTER TABLE "share_submission_lines" ADD CONSTRAINT "share_submission_lines_item_id_service_items_id_fk"
      FOREIGN KEY ("item_id") REFERENCES "public"."service_items"("id") ON DELETE set null;
  END IF;
END
$$;

-- Indexes --------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "share_links_token_key" ON "share_links" ("token");
CREATE INDEX IF NOT EXISTS "share_links_org_event_idx" ON "share_links" ("org_id", "event_id", "revoked");

CREATE INDEX IF NOT EXISTS "share_submissions_org_status_idx" ON "share_submissions" ("org_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "share_submissions_org_event_idx" ON "share_submissions" ("org_id", "event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "share_submissions_link_dedupe_key"
  ON "share_submissions" ("share_link_id", "dedupe_key");

CREATE UNIQUE INDEX IF NOT EXISTS "share_submission_services_submission_service_key"
  ON "share_submission_services" ("submission_id", "service_key");
CREATE INDEX IF NOT EXISTS "share_submission_services_org_idx"
  ON "share_submission_services" ("org_id", "service_key");

CREATE INDEX IF NOT EXISTS "share_submission_lines_org_service_idx"
  ON "share_submission_lines" ("org_id", "submission_service_id", "sort_order");
