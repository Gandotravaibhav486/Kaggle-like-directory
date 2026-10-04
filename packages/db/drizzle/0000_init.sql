CREATE TABLE "competitions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"currency" text DEFAULT 'INR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"revision" integer NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"note" text,
	"restored_from_revision" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "page_revisions_page_revision_unique" UNIQUE("page_id","revision")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"competition_id" text NOT NULL,
	"kind" text NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"current_revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "pages_competition_kind_unique" UNIQUE("competition_id","kind")
);
--> statement-breakpoint
CREATE TABLE "board_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"label" text NOT NULL,
	"value" double precision NOT NULL,
	"entry_date" date NOT NULL,
	"source_note" text NOT NULL,
	"evidence_url" text,
	"example" boolean DEFAULT false NOT NULL,
	"seed_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_entries_seed_key_unique" UNIQUE("seed_key"),
	CONSTRAINT "board_entries_source_note_not_blank" CHECK (length(trim("board_entries"."source_note")) > 0)
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" text PRIMARY KEY NOT NULL,
	"competition_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"objective" text NOT NULL,
	"unit" text NOT NULL,
	"direction" text NOT NULL,
	"target" double precision,
	"period" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"decimals" integer DEFAULT 2 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boards_competition_slug_unique" UNIQUE("competition_id","slug")
);
--> statement-breakpoint
CREATE TABLE "ledger_months" (
	"id" text PRIMARY KEY NOT NULL,
	"competition_id" text NOT NULL,
	"month" date NOT NULL,
	"revenue_minor" bigint DEFAULT 0 NOT NULL,
	"paying_customers" integer DEFAULT 0 NOT NULL,
	"invoices_raised" integer DEFAULT 0 NOT NULL,
	"invoices_paid" integer DEFAULT 0 NOT NULL,
	"hosting_minor" bigint DEFAULT 0 NOT NULL,
	"speech_minor" bigint DEFAULT 0 NOT NULL,
	"ai_usage_minor" bigint DEFAULT 0 NOT NULL,
	"other_minor" bigint DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"shared_publicly" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_months_competition_month_unique" UNIQUE("competition_id","month")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "dev_magic_links" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"url" text NOT NULL,
	"app" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "agent_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"competition_id" text NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"rate_limit" integer DEFAULT 10 NOT NULL,
	"rate_window_seconds" integer DEFAULT 60 NOT NULL,
	"window_started_at" timestamp with time zone,
	"window_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "agent_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"author_type" text NOT NULL,
	"author_name" text NOT NULL,
	"author_user_id" text,
	"body_md" text DEFAULT '' NOT NULL,
	"agent_source" text,
	"agent_payload" jsonb,
	"agent_token_id" text,
	"model" text,
	"is_mock" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"hidden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "replies_agent_requires_payload" CHECK ("replies"."author_type" <> 'agent' OR ("replies"."agent_payload" IS NOT NULL AND "replies"."agent_source" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"competition_id" text NOT NULL,
	"title" text NOT NULL,
	"tag" text NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"author_name" text NOT NULL,
	"author_user_id" text,
	"seed_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "threads_seed_key_unique" UNIQUE("seed_key")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"competition_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text,
	"used_for" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"seed_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_seed_key_unique" UNIQUE("seed_key")
);
--> statement-breakpoint
ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_entries" ADD CONSTRAINT "board_entries_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_months" ADD CONSTRAINT "ledger_months_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tokens" ADD CONSTRAINT "agent_tokens_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_agent_token_id_agent_tokens_id_fk" FOREIGN KEY ("agent_token_id") REFERENCES "public"."agent_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_entries_board_idx" ON "board_entries" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "dev_magic_links_email_created_idx" ON "dev_magic_links" USING btree ("email","created_at" desc);--> statement-breakpoint
CREATE INDEX "agent_tokens_competition_idx" ON "agent_tokens" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "replies_thread_created_idx" ON "replies" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "threads_competition_activity_idx" ON "threads" USING btree ("competition_id","last_activity_at");--> statement-breakpoint
CREATE INDEX "resources_competition_idx" ON "resources" USING btree ("competition_id");