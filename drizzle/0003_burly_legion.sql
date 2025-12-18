ALTER TABLE "lobby_players" RENAME COLUMN "player_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "match_players" RENAME COLUMN "player_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "lobby_players" ADD CONSTRAINT "lobby_players_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lobby_players_userId_idx" ON "lobby_players" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "match_players_userId_idx" ON "match_players" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "lobby_players" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "lobby_players" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "match_players" DROP COLUMN "username";