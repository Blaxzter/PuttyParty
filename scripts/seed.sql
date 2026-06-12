-- Demo data for local dev. Apply with `npm run db:seed:local`.
-- Re-runnable: clears the demo games first. Public entry/board URLs:
--   /g/sommerfest-demo        /g/sommerfest-demo/board
--   /g/oster-demo             /g/jugend-demo            /g/weihnachten-demo
-- Self-service manage URL (secret owner link), e.g.:
--   /m/sommerfest-manage-demo

DELETE FROM entries WHERE game_id IN (
  SELECT id FROM games WHERE public_id IN
    ('sommerfest-demo', 'oster-demo', 'jugend-demo', 'weihnachten-demo')
);
DELETE FROM games WHERE public_id IN
  ('sommerfest-demo', 'oster-demo', 'jugend-demo', 'weihnachten-demo');

INSERT INTO games (public_id, manage_id, name, date, location, holes, entry_mode, teams_enabled, status, created_at, updated_at) VALUES
  ('sommerfest-demo', 'sommerfest-manage-demo', 'Sommerfest-Cup',      '2026-06-28', 'Pfadiheim',     9, 'per_hole', 1, 'open',     1750000004000, 1750000004000),
  ('oster-demo',      'oster-manage-demo',      'Oster-Turnier',       '2026-04-12', 'Gemeindesaal',  9, 'total',    1, 'locked',   1750000003000, 1750000003000),
  ('weihnachten-demo','weihnachten-manage-demo','Weihnachtsfeier 2025','2025-12-19', 'Foyer',         9, 'total',    1, 'archived', 1750000002000, 1750000002000),
  ('jugend-demo',     'jugend-manage-demo',     'Jugend-Cup',          '2026-07-05', 'Aussenplatz',  12, 'total',    0, 'open',     1750000001000, 1750000001000);

-- Sommerfest-Cup: 14 entries, a tie at 43 (Sandra/Jonas).
INSERT INTO entries (game_id, name, team, strokes) VALUES
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Lena Vogt',       'Diakonie',       35),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Andrea Moser',    'Verwaltung',     37),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Markus Brunner',  'Haustechnik',    38),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Tobias Frei',     'Empfang',        41),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Sandra Keller',   'Kita',           43),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Jonas Wirth',     'IT',             43),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Petra Lang',      'Sozialberatung', 46),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Daniel Roth',     'Diakonie',       47),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Nina Bühler',     'Verwaltung',     48),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Stefan Graf',     'Haustechnik',    49),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Claudia Meier',   'Kita',           50),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Thomas Wolf',     'IT',             52),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Sabine Huber',    'Empfang',        54),
  ((SELECT id FROM games WHERE public_id = 'sommerfest-demo'), 'Michael Berger',  'Sozialberatung', 57);

-- Oster-Turnier: locked, 6 entries.
INSERT INTO entries (game_id, name, team, strokes) VALUES
  ((SELECT id FROM games WHERE public_id = 'oster-demo'), 'Eva Schmid',    'Diakonie',    33),
  ((SELECT id FROM games WHERE public_id = 'oster-demo'), 'Lukas Weber',   'Verwaltung',  36),
  ((SELECT id FROM games WHERE public_id = 'oster-demo'), 'Maria Koch',    'Kita',        39),
  ((SELECT id FROM games WHERE public_id = 'oster-demo'), 'Felix Braun',   'IT',          40),
  ((SELECT id FROM games WHERE public_id = 'oster-demo'), 'Julia Fischer', 'Empfang',     44),
  ((SELECT id FROM games WHERE public_id = 'oster-demo'), 'Paul Richter',  'Haustechnik', 45);

-- Weihnachtsfeier 2025: archived, 4 entries.
INSERT INTO entries (game_id, name, team, strokes) VALUES
  ((SELECT id FROM games WHERE public_id = 'weihnachten-demo'), 'Hanna Krause', 'Kita',        41),
  ((SELECT id FROM games WHERE public_id = 'weihnachten-demo'), 'Jan Hoffmann', 'IT',          42),
  ((SELECT id FROM games WHERE public_id = 'weihnachten-demo'), 'Lea Schäfer',  'Verwaltung',  46),
  ((SELECT id FROM games WHERE public_id = 'weihnachten-demo'), 'Tim Scholz',   'Empfang',     48);

-- Jugend-Cup: open, no entries yet (empty-state demo).
