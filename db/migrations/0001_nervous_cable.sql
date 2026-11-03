ALTER TABLE "service_items" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "service_items" ADD COLUMN "section_id" uuid;--> statement-breakpoint
ALTER TABLE "service_items" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "service_items" ADD COLUMN "image_bytes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_items" ADD COLUMN "dietary" text;--> statement-breakpoint
ALTER TABLE "service_items" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_section_id_menu_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."menu_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_group_id_menu_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."menu_groups"("id") ON DELETE set null ON UPDATE no action;