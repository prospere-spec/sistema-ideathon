ALTER TABLE "phase_ideas" ADD COLUMN "presentation_order" integer;
--> statement-breakpoint
CREATE INDEX "phase_ideas_room_presentation_order_idx" ON "phase_ideas" USING btree ("room_id", "presentation_order");
--> statement-breakpoint
ALTER TABLE "phase_ideas" ADD CONSTRAINT "phase_ideas_presentation_order_positive_check" CHECK ("presentation_order" is null or "presentation_order" > 0);
