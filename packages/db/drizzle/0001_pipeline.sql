CREATE TABLE "prospects" (
	"id" text PRIMARY KEY NOT NULL,
	"competition_id" text NOT NULL,
	"company" text NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"contact_email" text,
	"channel" text DEFAULT '' NOT NULL,
	"emailed_on" date NOT NULL,
	"replied_on" date,
	"demo_on" date,
	"second_call_on" date,
	"won_on" date,
	"lost_on" date,
	"contract_value_minor" bigint,
	"note" text DEFAULT '' NOT NULL,
	"example" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prospects_competition_idx" ON "prospects" USING btree ("competition_id","emailed_on");