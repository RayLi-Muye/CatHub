CREATE TYPE "public"."lineage_parent_role" AS ENUM('sire', 'dam', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."lineage_source_type" AS ENUM('internal', 'external', 'registry', 'import');--> statement-breakpoint
CREATE TYPE "public"."lineage_status" AS ENUM('pending', 'confirmed', 'disputed', 'revoked');--> statement-breakpoint
CREATE TABLE "cat_lineage_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_cat_id" uuid NOT NULL,
	"child_cat_id" uuid NOT NULL,
	"parent_role" "lineage_parent_role" NOT NULL,
	"status" "lineage_status" DEFAULT 'confirmed' NOT NULL,
	"source_type" "lineage_source_type" DEFAULT 'internal' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"confirmed_by_user_id" uuid,
	"notes" text,
	"identity_snapshot" json,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lineage_edges_no_self_parent_check" CHECK ("cat_lineage_edges"."parent_cat_id" <> "cat_lineage_edges"."child_cat_id")
);
--> statement-breakpoint
ALTER TABLE "cat_lineage_edges" ADD CONSTRAINT "cat_lineage_edges_parent_cat_id_cats_id_fk" FOREIGN KEY ("parent_cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_lineage_edges" ADD CONSTRAINT "cat_lineage_edges_child_cat_id_cats_id_fk" FOREIGN KEY ("child_cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_lineage_edges" ADD CONSTRAINT "cat_lineage_edges_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_lineage_edges" ADD CONSTRAINT "cat_lineage_edges_confirmed_by_user_id_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lineage_edges_parent_idx" ON "cat_lineage_edges" USING btree ("parent_cat_id");--> statement-breakpoint
CREATE INDEX "lineage_edges_child_idx" ON "cat_lineage_edges" USING btree ("child_cat_id");--> statement-breakpoint
CREATE INDEX "lineage_edges_created_by_idx" ON "cat_lineage_edges" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "lineage_edges_child_role_status_idx" ON "cat_lineage_edges" USING btree ("child_cat_id","parent_role","status");--> statement-breakpoint
CREATE INDEX "lineage_edges_parent_status_idx" ON "cat_lineage_edges" USING btree ("parent_cat_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "lineage_edges_parent_child_confirmed_idx" ON "cat_lineage_edges" USING btree ("parent_cat_id","child_cat_id") WHERE "cat_lineage_edges"."status" = 'confirmed';--> statement-breakpoint
CREATE UNIQUE INDEX "lineage_edges_child_sire_confirmed_idx" ON "cat_lineage_edges" USING btree ("child_cat_id") WHERE "cat_lineage_edges"."parent_role" = 'sire' and "cat_lineage_edges"."status" = 'confirmed';--> statement-breakpoint
CREATE UNIQUE INDEX "lineage_edges_child_dam_confirmed_idx" ON "cat_lineage_edges" USING btree ("child_cat_id") WHERE "cat_lineage_edges"."parent_role" = 'dam' and "cat_lineage_edges"."status" = 'confirmed';