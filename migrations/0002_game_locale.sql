-- Per-game language: the board (rendered once by the Durable Object and
-- broadcast to every screen) and the entry page render in this locale, chosen by
-- the organiser at creation. Existing games default to German.
ALTER TABLE games ADD COLUMN locale TEXT NOT NULL DEFAULT 'de';
