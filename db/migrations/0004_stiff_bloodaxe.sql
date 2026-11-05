CREATE TABLE "category_selection_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"required" boolean DEFAULT false NOT NULL,
	"allow_substitutions" boolean DEFAULT true NOT NULL,
	"allow_custom_requests" boolean DEFAULT false NOT NULL,
	"pricing_mode" text DEFAULT 'per_guest' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catering_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_time" text,
	"end_time" text,
	"min_guests" integer,
	"max_guests" integer,
	"cutoff_hours" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catering_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dietary_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_allergen" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_catering_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"template_id" uuid,
	"name" text NOT NULL,
	"session_date" date,
	"start_time" text,
	"end_time" text,
	"guest_count" integer DEFAULT 0 NOT NULL,
	"service_style" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"inventory_item_id" uuid,
	"name" text NOT NULL,
	"quantity_milli_per_serving" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'g' NOT NULL,
	"wastage_bp" integer DEFAULT 0 NOT NULL,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_dietary_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_session_id" uuid NOT NULL,
	"profile_key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"event_session_id" uuid NOT NULL,
	"item_id" uuid,
	"category_id" uuid,
	"name_snapshot" text NOT NULL,
	"unit_snapshot" text,
	"unit_price_paise" integer DEFAULT 0 NOT NULL,
	"unit_class_snapshot" text DEFAULT 'PER_GUEST' NOT NULL,
	"dietary_snapshot" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_selection_rules" ADD CONSTRAINT "category_selection_rules_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_selection_rules" ADD CONSTRAINT "category_selection_rules_session_id_catering_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."catering_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_selection_rules" ADD CONSTRAINT "category_selection_rules_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catering_sessions" ADD CONSTRAINT "catering_sessions_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catering_snapshots" ADD CONSTRAINT "catering_snapshots_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catering_snapshots" ADD CONSTRAINT "catering_snapshots_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietary_profiles" ADD CONSTRAINT "dietary_profiles_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_catering_sessions" ADD CONSTRAINT "event_catering_sessions_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_catering_sessions" ADD CONSTRAINT "event_catering_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_catering_sessions" ADD CONSTRAINT "event_catering_sessions_template_id_catering_sessions_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."catering_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_categories" ADD CONSTRAINT "menu_item_categories_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_categories" ADD CONSTRAINT "menu_item_categories_item_id_service_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."service_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_categories" ADD CONSTRAINT "menu_item_categories_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_item_id_service_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."service_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_dietary_counts" ADD CONSTRAINT "session_dietary_counts_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_dietary_counts" ADD CONSTRAINT "session_dietary_counts_event_session_id_event_catering_sessions_id_fk" FOREIGN KEY ("event_session_id") REFERENCES "public"."event_catering_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_menu_items" ADD CONSTRAINT "session_menu_items_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_menu_items" ADD CONSTRAINT "session_menu_items_event_session_id_event_catering_sessions_id_fk" FOREIGN KEY ("event_session_id") REFERENCES "public"."event_catering_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_menu_items" ADD CONSTRAINT "session_menu_items_item_id_service_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."service_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_menu_items" ADD CONSTRAINT "session_menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_selection_rules_session_category_key" ON "category_selection_rules" USING btree ("session_id","category_id");--> statement-breakpoint
CREATE INDEX "category_selection_rules_org_session_idx" ON "category_selection_rules" USING btree ("org_id","session_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "catering_sessions_org_name_key" ON "catering_sessions" USING btree ("org_id","name");--> statement-breakpoint
CREATE INDEX "catering_sessions_org_sort_idx" ON "catering_sessions" USING btree ("org_id","active","sort_order");--> statement-breakpoint
CREATE INDEX "catering_snapshots_org_event_idx" ON "catering_snapshots" USING btree ("org_id","event_id","captured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "dietary_profiles_org_key_key" ON "dietary_profiles" USING btree ("org_id","key");--> statement-breakpoint
CREATE INDEX "dietary_profiles_org_sort_idx" ON "dietary_profiles" USING btree ("org_id","active","sort_order");--> statement-breakpoint
CREATE INDEX "event_catering_sessions_org_event_idx" ON "event_catering_sessions" USING btree ("org_id","event_id","sort_order");--> statement-breakpoint
CREATE INDEX "event_catering_sessions_org_date_idx" ON "event_catering_sessions" USING btree ("org_id","session_date","status");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_categories_org_name_key" ON "menu_categories" USING btree ("org_id","name");--> statement-breakpoint
CREATE INDEX "menu_categories_org_sort_idx" ON "menu_categories" USING btree ("org_id","active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_item_categories_item_category_key" ON "menu_item_categories" USING btree ("item_id","category_id");--> statement-breakpoint
CREATE INDEX "menu_item_categories_org_category_idx" ON "menu_item_categories" USING btree ("org_id","category_id");--> statement-breakpoint
CREATE INDEX "menu_item_ingredients_org_item_idx" ON "menu_item_ingredients" USING btree ("org_id","item_id","sort_order");--> statement-breakpoint
CREATE INDEX "menu_item_ingredients_org_inventory_idx" ON "menu_item_ingredients" USING btree ("org_id","inventory_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_dietary_counts_session_profile_key" ON "session_dietary_counts" USING btree ("event_session_id","profile_key");--> statement-breakpoint
CREATE INDEX "session_dietary_counts_org_session_idx" ON "session_dietary_counts" USING btree ("org_id","event_session_id");--> statement-breakpoint
CREATE INDEX "session_menu_items_org_session_idx" ON "session_menu_items" USING btree ("org_id","event_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_menu_items_session_item_key" ON "session_menu_items" USING btree ("event_session_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "clients_org_phone_key" ON "clients" USING btree ("org_id","phone_normalized") WHERE "clients"."phone_normalized" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_org_quotation_key" ON "invoices" USING btree ("org_id","quotation_id") WHERE "invoices"."quotation_id" is not null;