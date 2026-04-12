CREATE TYPE "public"."cat_identity_code_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "cat_identity_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_id" uuid NOT NULL,
	"code" varchar(32) NOT NULL,
	"visibility" "cat_identity_code_visibility" DEFAULT 'private' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cat_identity_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "cat_identity_codes" ADD CONSTRAINT "cat_identity_codes_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_identity_codes" ADD CONSTRAINT "cat_identity_codes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cat_identity_codes_cat_idx" ON "cat_identity_codes" USING btree ("cat_id");--> statement-breakpoint
CREATE INDEX "cat_identity_codes_created_by_idx" ON "cat_identity_codes" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cat_identity_codes_cat_active_idx" ON "cat_identity_codes" USING btree ("cat_id") WHERE "cat_identity_codes"."is_active" = true;