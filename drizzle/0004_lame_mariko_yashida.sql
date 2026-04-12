CREATE TYPE "public"."lineage_connection_status" AS ENUM('pending', 'accepted', 'declined', 'canceled');--> statement-breakpoint
CREATE TABLE "lineage_connection_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"responder_user_id" uuid NOT NULL,
	"child_cat_id" uuid NOT NULL,
	"parent_cat_id" uuid NOT NULL,
	"identity_code_id" uuid,
	"parent_role" "lineage_parent_role" NOT NULL,
	"status" "lineage_connection_status" DEFAULT 'pending' NOT NULL,
	"request_note" text,
	"response_note" text,
	"edge_id" uuid,
	"identity_snapshot" json,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lineage_connection_requests_no_self_parent_check" CHECK ("lineage_connection_requests"."parent_cat_id" <> "lineage_connection_requests"."child_cat_id"),
	CONSTRAINT "lineage_connection_requests_external_users_check" CHECK ("lineage_connection_requests"."requester_user_id" <> "lineage_connection_requests"."responder_user_id")
);
--> statement-breakpoint
ALTER TABLE "lineage_connection_requests" ADD CONSTRAINT "lineage_connection_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineage_connection_requests" ADD CONSTRAINT "lineage_connection_requests_responder_user_id_users_id_fk" FOREIGN KEY ("responder_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineage_connection_requests" ADD CONSTRAINT "lineage_connection_requests_child_cat_id_cats_id_fk" FOREIGN KEY ("child_cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineage_connection_requests" ADD CONSTRAINT "lineage_connection_requests_parent_cat_id_cats_id_fk" FOREIGN KEY ("parent_cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineage_connection_requests" ADD CONSTRAINT "lineage_connection_requests_identity_code_id_cat_identity_codes_id_fk" FOREIGN KEY ("identity_code_id") REFERENCES "public"."cat_identity_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineage_connection_requests" ADD CONSTRAINT "lineage_connection_requests_edge_id_cat_lineage_edges_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."cat_lineage_edges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lineage_connection_requests_requester_idx" ON "lineage_connection_requests" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX "lineage_connection_requests_responder_idx" ON "lineage_connection_requests" USING btree ("responder_user_id");--> statement-breakpoint
CREATE INDEX "lineage_connection_requests_child_idx" ON "lineage_connection_requests" USING btree ("child_cat_id");--> statement-breakpoint
CREATE INDEX "lineage_connection_requests_parent_idx" ON "lineage_connection_requests" USING btree ("parent_cat_id");--> statement-breakpoint
CREATE INDEX "lineage_connection_requests_status_idx" ON "lineage_connection_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lineage_connection_requests_responder_status_idx" ON "lineage_connection_requests" USING btree ("responder_user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "lineage_connection_requests_requester_status_idx" ON "lineage_connection_requests" USING btree ("requester_user_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lineage_connection_requests_pending_unique_idx" ON "lineage_connection_requests" USING btree ("child_cat_id","parent_cat_id","parent_role") WHERE "lineage_connection_requests"."status" = 'pending';