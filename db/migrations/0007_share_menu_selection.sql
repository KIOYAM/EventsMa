-- =============================================================================
-- 0007: Session-wise catering menu selections on the share portal
--
-- The customer picks dishes from the owner's real event plan: one row per event
-- session (guest count and amount frozen at submit) and one line per dish with
-- its session and category copied alongside. Idempotent: safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "share_submission_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "submission_id" uuid NOT NULL,
  "event_session_id" uuid,
  -- Snapshots: renaming or deleting the event session must not rewrite history.
  "name" text NOT NULL,
  "session_date" date,
  "start_time" text,
  "end_time" text,
  "guests" integer DEFAULT 0 NOT NULL,
  "dish_count" integer DEFAULT 0 NOT NULL,
  "indicative_paise" integer DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Which session a chosen dish belongs to, and what the owner called its category.
ALTER TABLE "share_submission_lines" ADD COLUMN IF NOT EXISTS "submission_session_id" uuid;
ALTER TABLE "share_submission_lines" ADD COLUMN IF NOT EXISTS "category_name" text;

-- Foreign keys ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submission_sessions_org_id_fk') THEN
    ALTER TABLE "share_submission_sessions" ADD CONSTRAINT "share_submission_sessions_org_id_fk"
      FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submission_sessions_submission_id_fk') THEN
    ALTER TABLE "share_submission_sessions" ADD CONSTRAINT "share_submission_sessions_submission_id_fk"
      FOREIGN KEY ("submission_id") REFERENCES "public"."share_submissions"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submission_sessions_event_session_id_fk') THEN
    ALTER TABLE "share_submission_sessions" ADD CONSTRAINT "share_submission_sessions_event_session_id_fk"
      FOREIGN KEY ("event_session_id") REFERENCES "public"."event_catering_sessions"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_submission_lines_session_id_fk') THEN
    ALTER TABLE "share_submission_lines" ADD CONSTRAINT "share_submission_lines_session_id_fk"
      FOREIGN KEY ("submission_session_id") REFERENCES "public"."share_submission_sessions"("id") ON DELETE set null;
  END IF;
END
$$;

-- Indexes --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "share_submission_sessions_org_submission_idx"
  ON "share_submission_sessions" ("org_id", "submission_id", "sort_order");
CREATE INDEX IF NOT EXISTS "share_submission_sessions_org_event_session_idx"
  ON "share_submission_sessions" ("org_id", "event_session_id");
CREATE INDEX IF NOT EXISTS "share_submission_lines_submission_session_idx"
  ON "share_submission_lines" ("submission_session_id", "sort_order");

-- RLS mirrors its sibling share tables exactly (see db/policies.sql).
ALTER TABLE "share_submission_sessions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS share_submission_sessions_select ON "share_submission_sessions";
CREATE POLICY share_submission_sessions_select ON "share_submission_sessions"
  FOR SELECT USING (public.has_org_role(org_id, array['owner','manager']));

DROP POLICY IF EXISTS share_submission_sessions_write ON "share_submission_sessions";
CREATE POLICY share_submission_sessions_write ON "share_submission_sessions"
  FOR ALL USING (public.has_org_role(org_id, array['owner','manager']))
  WITH CHECK (public.has_org_role(org_id, array['owner','manager']));
