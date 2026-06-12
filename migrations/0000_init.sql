-- Putt Party initial schema. Applied with `wrangler d1 migrations apply`.

CREATE TABLE games (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id     TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  date          TEXT    NOT NULL,
  location      TEXT,
  holes         INTEGER NOT NULL DEFAULT 9,
  entry_mode    TEXT    NOT NULL DEFAULT 'total',
  teams_enabled INTEGER NOT NULL DEFAULT 1,
  status        TEXT    NOT NULL DEFAULT 'open',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

CREATE UNIQUE INDEX idx_games_public_id ON games (public_id);

CREATE TABLE entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id      INTEGER NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  team         TEXT,
  strokes      INTEGER NOT NULL,
  hole_strokes TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

-- Lowest strokes ranks first; this composite index serves the board ordering.
CREATE INDEX idx_entries_game_strokes ON entries (game_id, strokes);
