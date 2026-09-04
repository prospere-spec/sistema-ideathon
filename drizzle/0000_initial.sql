CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'EVALUATOR');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."ideathon_status" AS ENUM('DRAFT', 'READY', 'LIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."phase_status" AS ENUM('DRAFT', 'READY', 'LIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."idea_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."phase_idea_status" AS ENUM('PENDING', 'QUALIFIED', 'ELIMINATED');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('DRAFT', 'READY', 'LIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."evaluation_config_status" AS ENUM('DRAFT', 'PUBLISHED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."evaluation_status" AS ENUM('DRAFT', 'SUBMITTED');--> statement-breakpoint

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" timestamptz,
  "image" text,
  "password_hash" text,
  "role" "user_role" DEFAULT 'EVALUATOR' NOT NULL,
  "status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
  "must_change_password" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role", "status");--> statement-breakpoint

CREATE TABLE "accounts" (
  "user_id" uuid NOT NULL,
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
  CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider", "provider_account_id")
);--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "sessions" (
  "session_token" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "expires" timestamptz NOT NULL
);--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamptz NOT NULL,
  CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier", "token")
);--> statement-breakpoint

CREATE TABLE "ideathons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "status" "ideathon_status" DEFAULT 'DRAFT' NOT NULL,
  "timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "created_by" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "ideathons_dates_order_check" CHECK ("ends_at" is null or "starts_at" is null or "ends_at" >= "starts_at")
);--> statement-breakpoint
CREATE UNIQUE INDEX "ideathons_slug_unique" ON "ideathons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ideathons_status_idx" ON "ideathons" USING btree ("status");--> statement-breakpoint
ALTER TABLE "ideathons" ADD CONSTRAINT "ideathons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "phases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ideathon_id" uuid NOT NULL,
  "name" text NOT NULL,
  "position" integer NOT NULL,
  "status" "phase_status" DEFAULT 'DRAFT' NOT NULL,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "phases_position_positive_check" CHECK ("position" >= 0),
  CONSTRAINT "phases_dates_order_check" CHECK ("ends_at" is null or "starts_at" is null or "ends_at" >= "starts_at")
);--> statement-breakpoint
CREATE UNIQUE INDEX "phases_ideathon_position_unique" ON "phases" USING btree ("ideathon_id", "position");--> statement-breakpoint
CREATE INDEX "phases_ideathon_status_idx" ON "phases" USING btree ("ideathon_id", "status");--> statement-breakpoint
CREATE UNIQUE INDEX "phases_one_live_per_ideathon" ON "phases" USING btree ("ideathon_id") WHERE "status" = 'LIVE';--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_ideathon_id_ideathons_id_fk" FOREIGN KEY ("ideathon_id") REFERENCES "public"."ideathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ideathon_id" uuid NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "teams_ideathon_name_unique" ON "teams" USING btree ("ideathon_id", "name");--> statement-breakpoint
CREATE INDEX "teams_ideathon_idx" ON "teams" USING btree ("ideathon_id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_ideathon_id_ideathons_id_fk" FOREIGN KEY ("ideathon_id") REFERENCES "public"."ideathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "name" text NOT NULL,
  "role" text DEFAULT 'Membro da equipe' NOT NULL,
  "email" text,
  "position" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "team_members_position_positive_check" CHECK ("position" >= 0)
);--> statement-breakpoint
CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "ideas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ideathon_id" uuid NOT NULL,
  "team_id" uuid NOT NULL,
  "name" text NOT NULL,
  "problem" text NOT NULL,
  "solution" text NOT NULL,
  "audience" text,
  "differentiation" text,
  "category" text,
  "pitch_deck_url" text,
  "video_pitch_url" text,
  "website_url" text,
  "status" "idea_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "ideas_ideathon_status_idx" ON "ideas" USING btree ("ideathon_id", "status");--> statement-breakpoint
CREATE INDEX "ideas_team_idx" ON "ideas" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_ideathon_id_ideathons_id_fk" FOREIGN KEY ("ideathon_id") REFERENCES "public"."ideathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "phase_id" uuid NOT NULL,
  "name" text NOT NULL,
  "position" integer NOT NULL,
  "status" "room_status" DEFAULT 'DRAFT' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "rooms_position_positive_check" CHECK ("position" >= 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_phase_position_unique" ON "rooms" USING btree ("phase_id", "position");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_phase_name_unique" ON "rooms" USING btree ("phase_id", "name");--> statement-breakpoint
CREATE INDEX "rooms_phase_status_idx" ON "rooms" USING btree ("phase_id", "status");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "phase_ideas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "phase_id" uuid NOT NULL,
  "idea_id" uuid NOT NULL,
  "room_id" uuid,
  "status" "phase_idea_status" DEFAULT 'PENDING' NOT NULL,
  "rank" integer,
  "source_phase_idea_id" uuid,
  "selected_by" uuid,
  "selected_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "phase_ideas_rank_positive_check" CHECK ("rank" is null or "rank" > 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX "phase_ideas_phase_idea_unique" ON "phase_ideas" USING btree ("phase_id", "idea_id");--> statement-breakpoint
CREATE INDEX "phase_ideas_phase_room_idx" ON "phase_ideas" USING btree ("phase_id", "room_id");--> statement-breakpoint
CREATE INDEX "phase_ideas_source_idx" ON "phase_ideas" USING btree ("source_phase_idea_id");--> statement-breakpoint
ALTER TABLE "phase_ideas" ADD CONSTRAINT "phase_ideas_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_ideas" ADD CONSTRAINT "phase_ideas_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_ideas" ADD CONSTRAINT "phase_ideas_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_ideas" ADD CONSTRAINT "phase_ideas_source_phase_idea_id_fk" FOREIGN KEY ("source_phase_idea_id") REFERENCES "public"."phase_ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_ideas" ADD CONSTRAINT "phase_ideas_selected_by_users_id_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "room_evaluators" (
  "room_id" uuid NOT NULL,
  "evaluator_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "room_evaluators_room_id_evaluator_id_pk" PRIMARY KEY("room_id", "evaluator_id")
);--> statement-breakpoint
CREATE INDEX "room_evaluators_evaluator_idx" ON "room_evaluators" USING btree ("evaluator_id");--> statement-breakpoint
ALTER TABLE "room_evaluators" ADD CONSTRAINT "room_evaluators_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_evaluators" ADD CONSTRAINT "room_evaluators_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "evaluation_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "phase_id" uuid NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "status" "evaluation_config_status" DEFAULT 'DRAFT' NOT NULL,
  "published_at" timestamptz,
  "locked_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "evaluation_configs_version_positive_check" CHECK ("version" > 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX "evaluation_configs_phase_version_unique" ON "evaluation_configs" USING btree ("phase_id", "version");--> statement-breakpoint
CREATE INDEX "evaluation_configs_phase_status_idx" ON "evaluation_configs" USING btree ("phase_id", "status");--> statement-breakpoint
ALTER TABLE "evaluation_configs" ADD CONSTRAINT "evaluation_configs_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "evaluation_criteria" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evaluation_config_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "position" integer NOT NULL,
  "weight" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "evaluation_criteria_position_positive_check" CHECK ("position" >= 0),
  CONSTRAINT "evaluation_criteria_weight_range_check" CHECK ("weight" > 0 and "weight" <= 100)
);--> statement-breakpoint
CREATE UNIQUE INDEX "evaluation_criteria_config_position_unique" ON "evaluation_criteria" USING btree ("evaluation_config_id", "position");--> statement-breakpoint
CREATE INDEX "evaluation_criteria_config_idx" ON "evaluation_criteria" USING btree ("evaluation_config_id");--> statement-breakpoint
ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_evaluation_config_id_fk" FOREIGN KEY ("evaluation_config_id") REFERENCES "public"."evaluation_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "scale_levels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evaluation_config_id" uuid NOT NULL,
  "value" integer NOT NULL,
  "label" text NOT NULL,
  "description" text NOT NULL,
  CONSTRAINT "scale_levels_value_range_check" CHECK ("value" between 1 and 5)
);--> statement-breakpoint
CREATE UNIQUE INDEX "scale_levels_config_value_unique" ON "scale_levels" USING btree ("evaluation_config_id", "value");--> statement-breakpoint
ALTER TABLE "scale_levels" ADD CONSTRAINT "scale_levels_evaluation_config_id_fk" FOREIGN KEY ("evaluation_config_id") REFERENCES "public"."evaluation_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "evaluations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "phase_idea_id" uuid NOT NULL,
  "evaluator_id" uuid NOT NULL,
  "room_id" uuid NOT NULL,
  "evaluation_config_id" uuid NOT NULL,
  "status" "evaluation_status" DEFAULT 'DRAFT' NOT NULL,
  "feedback" text,
  "final_score" numeric(5, 2),
  "submitted_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "evaluations_final_score_range_check" CHECK ("final_score" is null or ("final_score" >= 0 and "final_score" <= 100))
);--> statement-breakpoint
CREATE UNIQUE INDEX "evaluations_phase_idea_evaluator_unique" ON "evaluations" USING btree ("phase_idea_id", "evaluator_id");--> statement-breakpoint
CREATE INDEX "evaluations_phase_status_idx" ON "evaluations" USING btree ("phase_idea_id", "status");--> statement-breakpoint
CREATE INDEX "evaluations_evaluator_status_idx" ON "evaluations" USING btree ("evaluator_id", "status");--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_phase_idea_id_fk" FOREIGN KEY ("phase_idea_id") REFERENCES "public"."phase_ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluation_config_id_fk" FOREIGN KEY ("evaluation_config_id") REFERENCES "public"."evaluation_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "evaluation_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evaluation_id" uuid NOT NULL,
  "criterion_id" uuid NOT NULL,
  "score" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "evaluation_scores_range_check" CHECK ("score" between 1 and 5)
);--> statement-breakpoint
CREATE UNIQUE INDEX "evaluation_scores_evaluation_criterion_unique" ON "evaluation_scores" USING btree ("evaluation_id", "criterion_id");--> statement-breakpoint
CREATE INDEX "evaluation_scores_criterion_idx" ON "evaluation_scores" USING btree ("criterion_id");--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_criterion_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type", "entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
