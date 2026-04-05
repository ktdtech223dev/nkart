const SCHEMA = `
CREATE TABLE IF NOT EXISTS kart_players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  total_races INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kart_track_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  best_lap_time REAL,
  best_race_time REAL,
  race_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  UNIQUE(player_id, track_id),
  FOREIGN KEY (player_id) REFERENCES kart_players(id)
);

CREATE TABLE IF NOT EXISTS kart_cup_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  cup_id TEXT NOT NULL,
  best_trophy TEXT,
  completion_count INTEGER DEFAULT 0,
  UNIQUE(player_id, cup_id),
  FOREIGN KEY (player_id) REFERENCES kart_players(id)
);

CREATE TABLE IF NOT EXISTS kart_avatar_config (
  player_id TEXT PRIMARY KEY,
  avatar_id TEXT DEFAULT 'volta',
  helmet_variant TEXT DEFAULT 'default',
  suit_primary TEXT DEFAULT '#FF4D00',
  suit_accent TEXT DEFAULT '#FFFFFF',
  gloves_variant TEXT DEFAULT 'default',
  accessory_variant TEXT DEFAULT 'none',
  FOREIGN KEY (player_id) REFERENCES kart_players(id)
);

CREATE TABLE IF NOT EXISTS kart_kart_config (
  player_id TEXT PRIMARY KEY,
  body_variant TEXT DEFAULT 'classic',
  wheel_variant TEXT DEFAULT 'standard',
  spoiler_variant TEXT DEFAULT 'none',
  decal_variant TEXT DEFAULT 'clean',
  FOREIGN KEY (player_id) REFERENCES kart_players(id)
);

CREATE TABLE IF NOT EXISTS kart_unlocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  unlock_type TEXT NOT NULL,
  unlock_id TEXT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, unlock_type, unlock_id),
  FOREIGN KEY (player_id) REFERENCES kart_players(id)
);

CREATE TABLE IF NOT EXISTS kart_race_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  finish_position INTEGER,
  race_time REAL,
  points_earned INTEGER,
  raced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES kart_players(id)
);

CREATE TABLE IF NOT EXISTS kart_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  lap_time REAL NOT NULL,
  set_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_track ON kart_leaderboard(track_id, lap_time ASC);
CREATE INDEX IF NOT EXISTS idx_track_records_player ON kart_track_records(player_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_player ON kart_unlocks(player_id);
`;

function initKartDatabase(db) {
  const statements = SCHEMA.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    db.exec(stmt.trim() + ';');
  }
  console.log('[NKart] Database tables initialized');
}

module.exports = { initKartDatabase };
