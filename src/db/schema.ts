import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

function timestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  };
}

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "EVALUATOR"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE"]);
export const ideathonStatusEnum = pgEnum("ideathon_status", ["DRAFT", "READY", "LIVE", "CLOSED"]);
export const phaseStatusEnum = pgEnum("phase_status", ["DRAFT", "READY", "LIVE", "CLOSED"]);
export const ideaStatusEnum = pgEnum("idea_status", ["ACTIVE", "ARCHIVED"]);
export const phaseIdeaStatusEnum = pgEnum("phase_idea_status", ["PENDING", "QUALIFIED", "ELIMINATED"]);
export const roomStatusEnum = pgEnum("room_status", ["DRAFT", "READY", "LIVE", "CLOSED"]);
export const evaluationConfigStatusEnum = pgEnum("evaluation_config_status", ["DRAFT", "PUBLISHED", "LOCKED"]);
export const evaluationStatusEnum = pgEnum("evaluation_status", ["DRAFT", "SUBMITTED"]);

// Auth.js adapter tables plus application-specific user fields.
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("EVALUATOR"),
  status: userStatusEnum("status").notNull().default("ACTIVE"),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps(),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  index("users_role_status_idx").on(table.role, table.status),
]);

export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (table) => [
  primaryKey({ columns: [table.provider, table.providerAccountId] }),
  index("accounts_user_id_idx").on(table.userId),
]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").notNull().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => [index("sessions_user_id_idx").on(table.userId)]);

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => [primaryKey({ columns: [table.identifier, table.token] })]);

export const ideathons = pgTable("ideathons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  status: ideathonStatusEnum("status").notNull().default("DRAFT"),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  ...timestamps(),
}, (table) => [
  uniqueIndex("ideathons_slug_unique").on(table.slug),
  index("ideathons_status_idx").on(table.status),
  check("ideathons_dates_order_check", sql`${table.endsAt} is null or ${table.startsAt} is null or ${table.endsAt} >= ${table.startsAt}`),
]);

export const phases = pgTable("phases", {
  id: uuid("id").defaultRandom().primaryKey(),
  ideathonId: uuid("ideathon_id").notNull().references(() => ideathons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  status: phaseStatusEnum("status").notNull().default("DRAFT"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  ...timestamps(),
}, (table) => [
  uniqueIndex("phases_ideathon_position_unique").on(table.ideathonId, table.position),
  uniqueIndex("phases_one_live_per_ideathon").on(table.ideathonId).where(sql`${table.status} = 'LIVE'`),
  index("phases_ideathon_status_idx").on(table.ideathonId, table.status),
  check("phases_position_positive_check", sql`${table.position} >= 0`),
  check("phases_dates_order_check", sql`${table.endsAt} is null or ${table.startsAt} is null or ${table.endsAt} >= ${table.startsAt}`),
]);

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  ideathonId: uuid("ideathon_id").notNull().references(() => ideathons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ...timestamps(),
}, (table) => [
  uniqueIndex("teams_ideathon_name_unique").on(table.ideathonId, table.name),
  index("teams_ideathon_idx").on(table.ideathonId),
]);

export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull().default("Membro da equipe"),
  email: text("email"),
  position: integer("position").notNull().default(0),
}, (table) => [
  index("team_members_team_idx").on(table.teamId),
  check("team_members_position_positive_check", sql`${table.position} >= 0`),
]);

export const ideas = pgTable("ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  ideathonId: uuid("ideathon_id").notNull().references(() => ideathons.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").notNull().references(() => teams.id),
  name: text("name").notNull(),
  problem: text("problem").notNull(),
  solution: text("solution").notNull(),
  audience: text("audience"),
  differentiation: text("differentiation"),
  category: text("category"),
  pitchDeckUrl: text("pitch_deck_url"),
  videoPitchUrl: text("video_pitch_url"),
  websiteUrl: text("website_url"),
  status: ideaStatusEnum("status").notNull().default("ACTIVE"),
  ...timestamps(),
}, (table) => [
  index("ideas_ideathon_status_idx").on(table.ideathonId, table.status),
  index("ideas_team_idx").on(table.teamId),
]);

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  phaseId: uuid("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  status: roomStatusEnum("status").notNull().default("DRAFT"),
  ...timestamps(),
}, (table) => [
  uniqueIndex("rooms_phase_position_unique").on(table.phaseId, table.position),
  uniqueIndex("rooms_phase_name_unique").on(table.phaseId, table.name),
  index("rooms_phase_status_idx").on(table.phaseId, table.status),
  check("rooms_position_positive_check", sql`${table.position} >= 0`),
]);

export const phaseIdeas = pgTable("phase_ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  phaseId: uuid("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" }),
  ideaId: uuid("idea_id").notNull().references(() => ideas.id),
  roomId: uuid("room_id").references(() => rooms.id),
  status: phaseIdeaStatusEnum("status").notNull().default("PENDING"),
  rank: integer("rank"),
  presentationOrder: integer("presentation_order"),
  sourcePhaseIdeaId: uuid("source_phase_idea_id").references((): AnyPgColumn => phaseIdeas.id),
  selectedBy: uuid("selected_by").references(() => users.id),
  selectedAt: timestamp("selected_at", { withTimezone: true }),
  ...timestamps(),
}, (table) => [
  uniqueIndex("phase_ideas_phase_idea_unique").on(table.phaseId, table.ideaId),
  index("phase_ideas_phase_room_idx").on(table.phaseId, table.roomId),
  index("phase_ideas_room_presentation_order_idx").on(table.roomId, table.presentationOrder),
  index("phase_ideas_source_idx").on(table.sourcePhaseIdeaId),
  check("phase_ideas_rank_positive_check", sql`${table.rank} is null or ${table.rank} > 0`),
  check("phase_ideas_presentation_order_positive_check", sql`${table.presentationOrder} is null or ${table.presentationOrder} > 0`),
]);

export const roomEvaluators = pgTable("room_evaluators", {
  roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  evaluatorId: uuid("evaluator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.roomId, table.evaluatorId] }),
  index("room_evaluators_evaluator_idx").on(table.evaluatorId),
]);

export const evaluationConfigs = pgTable("evaluation_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  phaseId: uuid("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  status: evaluationConfigStatusEnum("status").notNull().default("DRAFT"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  ...timestamps(),
}, (table) => [
  uniqueIndex("evaluation_configs_phase_version_unique").on(table.phaseId, table.version),
  index("evaluation_configs_phase_status_idx").on(table.phaseId, table.status),
  check("evaluation_configs_version_positive_check", sql`${table.version} > 0`),
]);

export const evaluationCriteria = pgTable("evaluation_criteria", {
  id: uuid("id").defaultRandom().primaryKey(),
  evaluationConfigId: uuid("evaluation_config_id").notNull().references(() => evaluationConfigs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  position: integer("position").notNull(),
  weight: integer("weight").notNull(),
  ...timestamps(),
}, (table) => [
  uniqueIndex("evaluation_criteria_config_position_unique").on(table.evaluationConfigId, table.position),
  index("evaluation_criteria_config_idx").on(table.evaluationConfigId),
  check("evaluation_criteria_position_positive_check", sql`${table.position} >= 0`),
  check("evaluation_criteria_weight_range_check", sql`${table.weight} > 0 and ${table.weight} <= 100`),
]);

export const scaleLevels = pgTable("scale_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  evaluationConfigId: uuid("evaluation_config_id").notNull().references(() => evaluationConfigs.id, { onDelete: "cascade" }),
  value: integer("value").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull(),
}, (table) => [
  uniqueIndex("scale_levels_config_value_unique").on(table.evaluationConfigId, table.value),
  check("scale_levels_value_range_check", sql`${table.value} between 1 and 5`),
]);

export const evaluations = pgTable("evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  phaseIdeaId: uuid("phase_idea_id").notNull().references(() => phaseIdeas.id),
  evaluatorId: uuid("evaluator_id").notNull().references(() => users.id),
  roomId: uuid("room_id").notNull().references(() => rooms.id),
  evaluationConfigId: uuid("evaluation_config_id").notNull().references(() => evaluationConfigs.id),
  status: evaluationStatusEnum("status").notNull().default("DRAFT"),
  feedback: text("feedback"),
  finalScore: numeric("final_score", { precision: 5, scale: 2 }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  ...timestamps(),
}, (table) => [
  uniqueIndex("evaluations_phase_idea_evaluator_unique").on(table.phaseIdeaId, table.evaluatorId),
  index("evaluations_phase_status_idx").on(table.phaseIdeaId, table.status),
  index("evaluations_evaluator_status_idx").on(table.evaluatorId, table.status),
  check("evaluations_final_score_range_check", sql`${table.finalScore} is null or (${table.finalScore} >= 0 and ${table.finalScore} <= 100)`),
]);

export const evaluationScores = pgTable("evaluation_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  evaluationId: uuid("evaluation_id").notNull().references(() => evaluations.id, { onDelete: "cascade" }),
  criterionId: uuid("criterion_id").notNull().references(() => evaluationCriteria.id),
  score: integer("score").notNull(),
  ...timestamps(),
}, (table) => [
  uniqueIndex("evaluation_scores_evaluation_criterion_unique").on(table.evaluationId, table.criterionId),
  index("evaluation_scores_criterion_idx").on(table.criterionId),
  check("evaluation_scores_range_check", sql`${table.score} between 1 and 5`),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  index("audit_logs_actor_idx").on(table.actorUserId),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export type User = typeof users.$inferSelect;
export type Ideathon = typeof ideathons.$inferSelect;
export type Phase = typeof phases.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type PhaseIdea = typeof phaseIdeas.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
