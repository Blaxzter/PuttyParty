-- Self-service ownership: a secret manage token (capability URL /m/<token>).
-- Nullable so the unique index tolerates pre-existing rows; the app always sets
-- it on create, and the seed backfills the demo games.

ALTER TABLE games ADD COLUMN manage_id TEXT;

CREATE UNIQUE INDEX idx_games_manage_id ON games (manage_id);
