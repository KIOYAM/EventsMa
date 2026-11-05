-- =============================================================================
-- 0005: Decoration, Makeup & Photography service tables
--
-- Adds independent service modules for decoration, makeup and photography.
-- Each table is org-scoped (org_id) and references events for event composition.
-- =============================================================================

-- -----------------------------------------------------
-- Event <-> Service composition
-- Links one event to multiple independently configured services.
-- -----------------------------------------------------
CREATE TABLE "event_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"service_key" text NOT NULL,
	"service_record_id" uuid,
	"status" text DEFAULT 'planned' NOT NULL,
	"config_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Decoration: setup areas per event
-- Area-wise decoration planning (stage, entrance, dining, etc.)
-- -----------------------------------------------------
CREATE TABLE "decoration_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"area_type" text NOT NULL,
	"dimensions" text,
	"setup_notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Decoration: setup schedules
-- Installation and dismantling timing per area.
-- -----------------------------------------------------
CREATE TABLE "decoration_setups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid,
	"area_id" uuid,
	"setup_start" timestamp with time zone,
	"setup_end" timestamp with time zone,
	"teardown_start" timestamp with time zone,
	"teardown_end" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"crew_assigned" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Decoration: material inventory
-- Reusable and consumable decoration materials.
-- -----------------------------------------------------
CREATE TABLE "decoration_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"quantity_available" integer DEFAULT 0 NOT NULL,
	"quantity_unit" text NOT NULL,
	"cost_paise_per_unit" integer DEFAULT 0 NOT NULL,
	"supplier" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Makeup: artist profiles
-- Makeup artists with skills, availability and pricing.
-- -----------------------------------------------------
CREATE TABLE "makeup_artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"skills" text ARRAY DEFAULT '{}' NOT NULL,
	"specializations" text ARRAY DEFAULT '{}' NOT NULL,
	"portfolio_path" text,
	"rate_paise_per_hour" integer DEFAULT 0 NOT NULL,
	"travel_fee_paise" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Makeup: appointment scheduling
-- Appointment-driven scheduling (unlike catering sessions).
-- -----------------------------------------------------
CREATE TABLE "makeup_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"artist_id" uuid,
	"client_name" text NOT NULL,
	"service_type" text NOT NULL,
	"appointment_start" timestamp with time zone NOT NULL,
	"appointment_end" timestamp with time zone NOT NULL,
	"location" text,
	"travel_required" boolean DEFAULT false NOT NULL,
	"travel_fee_paise" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Makeup: trial sessions
-- Pre-event makeup trials with customer approval.
-- -----------------------------------------------------
CREATE TABLE "makeup_trials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"artist_id" uuid,
	"client_name" text NOT NULL,
	"trial_date" date NOT NULL,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"makeup_style" text,
	"approved" boolean DEFAULT false NOT NULL,
	"approval_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Photography: coverage schedules
-- Event coverage planning per photographer.
-- -----------------------------------------------------
CREATE TABLE "photography_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"coverage_type" text NOT NULL,
	"coverage_start" timestamp with time zone NOT NULL,
	"coverage_end" timestamp with time zone NOT NULL,
	"location" text,
	"shot_list_notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Photography: photographer assignments
-- Assign photographers and assistants to coverage.
-- -----------------------------------------------------
CREATE TABLE "photography_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"coverage_id" uuid,
	"photographer_name" text NOT NULL,
	"role" text NOT NULL,
	"equipment" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Photography: shot lists
-- Customer-requested moments to capture.
-- -----------------------------------------------------
CREATE TABLE "photography_shot_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"moment" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"captured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Photography: deliverables
-- Album types, page counts, delivery tracking.
-- -----------------------------------------------------
CREATE TABLE "photography_deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"deliverable_type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivery_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------
-- Foreign keys
-- -----------------------------------------------------
ALTER TABLE "event_services" ADD CONSTRAINT "event_services_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "event_services" ADD CONSTRAINT "event_services_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "decoration_areas" ADD CONSTRAINT "decoration_areas_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "decoration_areas" ADD CONSTRAINT "decoration_areas_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "decoration_setups" ADD CONSTRAINT "decoration_setups_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "decoration_setups" ADD CONSTRAINT "decoration_setups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "decoration_setups" ADD CONSTRAINT "decoration_setups_area_id_decoration_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."decoration_areas"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "decoration_materials" ADD CONSTRAINT "decoration_materials_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "makeup_artists" ADD CONSTRAINT "makeup_artists_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "makeup_appointments" ADD CONSTRAINT "makeup_appointments_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "makeup_appointments" ADD CONSTRAINT "makeup_appointments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "makeup_appointments" ADD CONSTRAINT "makeup_appointments_artist_id_makeup_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."makeup_artists"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "makeup_trials" ADD CONSTRAINT "makeup_trials_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "makeup_trials" ADD CONSTRAINT "makeup_trials_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "makeup_trials" ADD CONSTRAINT "makeup_trials_artist_id_makeup_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."makeup_artists"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "photography_coverage" ADD CONSTRAINT "photography_coverage_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "photography_coverage" ADD CONSTRAINT "photography_coverage_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "photography_assignments" ADD CONSTRAINT "photography_assignments_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "photography_assignments" ADD CONSTRAINT "photography_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "photography_assignments" ADD CONSTRAINT "photography_assignments_coverage_id_photography_coverage_id_fk" FOREIGN KEY ("coverage_id") REFERENCES "public"."photography_coverage"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "photography_shot_lists" ADD CONSTRAINT "photography_shot_lists_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "photography_shot_lists" ADD CONSTRAINT "photography_shot_lists_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "photography_deliverables" ADD CONSTRAINT "photography_deliverables_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "photography_deliverables" ADD CONSTRAINT "photography_deliverables_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;

-- -----------------------------------------------------
-- Indexes
-- -----------------------------------------------------
CREATE INDEX "event_services_org_event_idx" ON "event_services" USING btree ("org_id", "event_id", "service_key");
CREATE UNIQUE INDEX "event_services_event_service_key_idx" ON "event_services" USING btree ("event_id", "service_key");

CREATE INDEX "decoration_areas_org_event_idx" ON "decoration_areas" USING btree ("org_id", "event_id", "active");
CREATE INDEX "decoration_areas_org_area_type_idx" ON "decoration_areas" USING btree ("org_id", "area_type");

CREATE INDEX "decoration_setups_org_event_idx" ON "decoration_setups" USING btree ("org_id", "event_id", "status");
CREATE INDEX "decoration_setups_org_date_idx" ON "decoration_setups" USING btree ("org_id", "setup_start", "setup_end");

CREATE INDEX "decoration_materials_org_category_idx" ON "decoration_materials" USING btree ("org_id", "category", "active");

CREATE INDEX "makeup_artists_org_active_idx" ON "makeup_artists" USING btree ("org_id", "active");
CREATE INDEX "makeup_artists_org_skills_idx" ON "makeup_artists" USING btree ("org_id", "skills");

CREATE INDEX "makeup_appointments_org_event_idx" ON "makeup_appointments" USING btree ("org_id", "event_id", "status");
CREATE INDEX "makeup_appointments_org_date_idx" ON "makeup_appointments" USING btree ("org_id", "appointment_start", "appointment_end");
CREATE INDEX "makeup_appointments_artist_idx" ON "makeup_appointments" USING btree ("artist_id", "appointment_start");

CREATE INDEX "makeup_trials_org_event_idx" ON "makeup_trials" USING btree ("org_id", "event_id", "approved");

CREATE INDEX "photography_coverage_org_event_idx" ON "photography_coverage" USING btree ("org_id", "event_id", "active");
CREATE INDEX "photography_coverage_org_date_idx" ON "photography_coverage" USING btree ("org_id", "coverage_start", "coverage_end");

CREATE INDEX "photography_assignments_org_event_idx" ON "photography_assignments" USING btree ("org_id", "event_id");

CREATE INDEX "photography_shot_lists_org_event_idx" ON "photography_shot_lists" USING btree ("org_id", "event_id", "captured");

CREATE INDEX "photography_deliverables_org_event_idx" ON "photography_deliverables" USING btree ("org_id", "event_id", "status");
