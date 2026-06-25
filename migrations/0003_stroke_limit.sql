-- Optional per-hole stroke limit (recreational mini-golf rule). The organiser may
-- cap how many strokes count on a single hole: after `max_strokes_per_hole`
-- attempts the ball is picked up and `pickup_penalty` strokes are added, so the
-- highest value recordable per hole is (max_strokes_per_hole + pickup_penalty).
-- NULL = no limit (existing behaviour). Penalty defaults to 1 (the classic "6 → 7").
ALTER TABLE games ADD COLUMN max_strokes_per_hole INTEGER;
ALTER TABLE games ADD COLUMN pickup_penalty INTEGER NOT NULL DEFAULT 1;
